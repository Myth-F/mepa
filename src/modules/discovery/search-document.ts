import type { Prisma, PrismaClient } from "@/generated/prisma";
import { projectBlockText } from "@/modules/authoring/blocks/registry";

// Builds and maintains the denormalized discovery document for a module. The
// document mirrors the module's CURRENT published version and is the single table
// the catalogue, facets and search read from. It is written inside the publish
// transaction and removed when a module has no published version.

interface ProjectableBlock {
  type: string;
  payload: unknown;
}

/**
 * Pure assembly of the searchable body text from ordered blocks, reusing the
 * same block text projection that feeds the AI boundary — one source of truth.
 */
export function assembleSearchBody(blocks: ProjectableBlock[]): string {
  return blocks
    .map((b) => projectBlockText(b.type, b.payload))
    .filter((t) => t.length > 0)
    .join("\n\n");
}

/**
 * Upsert (or delete) the discovery document for one module, and refresh its
 * weighted tsvector. Accepts a transaction client so it can run atomically with
 * publication. `unaccent` makes search accent-insensitive; weights rank title >
 * summary/tags > body.
 */
export async function writeSearchDocument(
  tx: Prisma.TransactionClient,
  moduleId: string,
): Promise<void> {
  const version = await tx.moduleVersion.findFirst({
    where: { moduleId, status: "PUBLISHED" },
    include: {
      blocks: { orderBy: { position: "asc" } },
      category: true,
      module: true,
    },
  });

  // No published version → the module must not appear in discovery.
  if (!version || !version.publishedAt) {
    await tx.moduleSearchDocument.deleteMany({ where: { moduleId } });
    return;
  }

  const body = assembleSearchBody(version.blocks);
  const popularity = await tx.moduleCompletion.count({
    where: { moduleVersion: { moduleId } },
  });

  const data = {
    slug: version.module.slug,
    title: version.title,
    summary: version.summary,
    body,
    categoryId: version.categoryId,
    categorySlug: version.category?.slug ?? null,
    categoryName: version.category?.name ?? null,
    level: version.level,
    estimatedMinutes: version.estimatedMinutes,
    language: version.language,
    tags: version.tags,
    popularity,
    publishedAt: version.publishedAt,
  };

  await tx.moduleSearchDocument.upsert({
    where: { moduleId },
    create: { moduleId, ...data },
    update: data,
  });

  // Maintain the tsvector (DML, so unaccent immutability is not required here).
  await tx.$executeRaw`
    UPDATE "module_search_document" SET "searchVector" =
      setweight(to_tsvector('french', unaccent("title")), 'A') ||
      setweight(to_tsvector('french', unaccent(coalesce("summary", ''))), 'B') ||
      setweight(to_tsvector('french', unaccent(array_to_string("tags", ' '))), 'B') ||
      setweight(to_tsvector('french', unaccent(coalesce("body", ''))), 'C')
    WHERE "moduleId" = ${moduleId}
  `;
}

/** Rebuild every discovery row from the authoritative current module state. */
export async function recomputeSearchDocuments(prisma: PrismaClient): Promise<number> {
  const modules = await prisma.module.findMany({ select: { id: true } });
  for (const courseModule of modules) {
    await prisma.$transaction((tx) => writeSearchDocument(tx, courseModule.id));
  }
  return modules.length;
}
