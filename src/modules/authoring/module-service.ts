import type { PrismaClient, Prisma, CourseLevel } from "@/generated/prisma";
import { validateBlock, getBlockDefinition } from "./blocks/registry";
import { writeSearchDocument } from "@/modules/discovery/search-document";

export interface DraftBlockInput {
  type: string;
  schemaVersion: number;
  payload: unknown;
}

export interface ModuleClassificationInput {
  categoryId?: string | null;
  level?: CourseLevel | null;
  estimatedMinutes?: number | null;
  language?: string;
  tags?: string[];
}

export interface PublishResult {
  ok: boolean;
  moduleVersionId?: string;
  errors: string[];
}

export class PublishedVersionImmutableError extends Error {
  constructor() {
    super("Une version publiée est immuable et ne peut pas être modifiée.");
    this.name = "PublishedVersionImmutableError";
  }
}

/**
 * Authoring domain service. Depends only on the injected PrismaClient and the
 * block registry — no Next.js, no HTTP. Encodes the two invariants from the
 * design: published versions are immutable, and publication validates the whole
 * draft inside a single transaction while archiving the previous published one.
 */
export class ModuleService {
  constructor(private readonly prisma: PrismaClient) {}

  /** Create a new module with an empty draft version (versionNumber 1). */
  async createModule(input: {
    slug: string;
    title: string;
    summary?: string;
    createdByStaffId: string;
    classification?: ModuleClassificationInput;
  }) {
    const c = input.classification;
    return this.prisma.module.create({
      data: {
        slug: input.slug,
        createdByStaffId: input.createdByStaffId,
        versions: {
          create: {
            versionNumber: 1,
            status: "DRAFT",
            title: input.title,
            summary: input.summary ?? "",
            categoryId: c?.categoryId ?? null,
            level: c?.level ?? null,
            estimatedMinutes: c?.estimatedMinutes ?? null,
            language: c?.language ?? "fr",
            tags: c?.tags ?? [],
          },
        },
      },
      include: { versions: true },
    });
  }

  /** Update the classification (facets) of a draft version. */
  async setDraftMetadata(moduleVersionId: string, classification: ModuleClassificationInput) {
    await this.prisma.$transaction(async (tx) => {
      await this.assertDraft(moduleVersionId, tx);
      await tx.moduleVersion.update({
        where: { id: moduleVersionId },
        data: {
          categoryId: classification.categoryId ?? null,
          level: classification.level ?? null,
          estimatedMinutes: classification.estimatedMinutes ?? null,
          language: classification.language ?? "fr",
          tags: classification.tags ?? [],
        },
      });
    });
  }

  /** Guard: refuse any mutation targeting a non-draft version. */
  private async assertDraft(moduleVersionId: string, tx: Prisma.TransactionClient) {
    const v = await tx.moduleVersion.findUnique({ where: { id: moduleVersionId } });
    if (!v) throw new Error("Version introuvable.");
    if (v.status !== "DRAFT") throw new PublishedVersionImmutableError();
    return v;
  }

  /** Replace the ordered set of blocks on a draft, validating every payload. */
  async setDraftBlocks(
    moduleVersionId: string,
    blocks: DraftBlockInput[],
  ): Promise<{ ok: boolean; errors: string[] }> {
    const errors: string[] = [];
    blocks.forEach((b, idx) => {
      const r = validateBlock(b.type, b.schemaVersion, b.payload);
      if (!r.ok) errors.push(...r.errors.map((e) => `Bloc ${idx + 1} : ${e}`));
    });
    if (errors.length > 0) return { ok: false, errors };

    await this.prisma.$transaction(async (tx) => {
      await this.assertDraft(moduleVersionId, tx);
      await tx.moduleBlock.deleteMany({ where: { moduleVersionId } });
      await tx.moduleBlock.createMany({
        data: blocks.map((b, position) => ({
          moduleVersionId,
          type: b.type,
          schemaVersion: b.schemaVersion,
          position,
          payload: b.payload as Prisma.InputJsonValue,
        })),
      });
    });
    return { ok: true, errors: [] };
  }

  /** Validate a complete draft without publishing (used by preview + publish). */
  async validateDraft(moduleVersionId: string): Promise<string[]> {
    const version = await this.prisma.moduleVersion.findUnique({
      where: { id: moduleVersionId },
      include: { blocks: { orderBy: { position: "asc" } } },
    });
    const errors: string[] = [];
    if (!version) return ["Version introuvable."];
    if (!version.title.trim()) errors.push("Le titre du module est obligatoire.");
    if (version.blocks.length === 0) errors.push("Un module doit contenir au moins un bloc.");
    version.blocks.forEach((b, idx) => {
      const def = getBlockDefinition(b.type);
      if (!def) {
        errors.push(`Bloc ${idx + 1} : type inconnu « ${b.type} ».`);
        return;
      }
      const r = validateBlock(b.type, b.schemaVersion, b.payload);
      if (!r.ok) errors.push(...r.errors.map((e) => `Bloc ${idx + 1} : ${e}`));
    });
    return errors;
  }

  /**
   * Publish a draft: validate the whole draft, archive the currently published
   * version (if any), and mark this version PUBLISHED — all in one transaction.
   * Published content becomes immutable (enforced by assertDraft on later edits).
   */
  async publish(moduleVersionId: string): Promise<PublishResult> {
    const errors = await this.validateDraft(moduleVersionId);
    if (errors.length > 0) return { ok: false, errors };

    const published = await this.prisma.$transaction(async (tx) => {
      const version = await this.assertDraft(moduleVersionId, tx);

      await tx.moduleVersion.updateMany({
        where: { moduleId: version.moduleId, status: "PUBLISHED" },
        data: { status: "ARCHIVED" },
      });

      const updated = await tx.moduleVersion.update({
        where: { id: moduleVersionId },
        data: { status: "PUBLISHED", publishedAt: new Date() },
      });

      // Build/refresh the discovery document atomically with publication.
      await writeSearchDocument(tx, version.moduleId);

      return updated;
    });

    return { ok: true, moduleVersionId: published.id, errors: [] };
  }

  /**
   * Begin editing a published module: leave the published version untouched and
   * create (or return) a separate draft with the next version number.
   */
  async startEdit(moduleId: string) {
    return this.prisma.$transaction(async (tx) => {
      const existingDraft = await tx.moduleVersion.findFirst({
        where: { moduleId, status: "DRAFT" },
      });
      if (existingDraft) return existingDraft;

      const latest = await tx.moduleVersion.findFirst({
        where: { moduleId },
        orderBy: { versionNumber: "desc" },
        include: { blocks: { orderBy: { position: "asc" } }, sources: true },
      });
      if (!latest) throw new Error("Module introuvable.");

      const draft = await tx.moduleVersion.create({
        data: {
          moduleId,
          versionNumber: latest.versionNumber + 1,
          status: "DRAFT",
          title: latest.title,
          summary: latest.summary,
          blocks: {
            create: latest.blocks.map((b) => ({
              type: b.type,
              schemaVersion: b.schemaVersion,
              position: b.position,
              payload: b.payload as Prisma.InputJsonValue,
            })),
          },
          sources: {
            create: latest.sources.map((s) => ({
              label: s.label,
              url: s.url,
              citation: s.citation,
            })),
          },
        },
      });
      return draft;
    });
  }
}
