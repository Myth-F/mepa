import type { PrismaClient } from "@/generated/prisma";
import { projectBlockText } from "@/modules/authoring/blocks/registry";
import type { ModuleContext, ModuleContextBuilder } from "./contracts";

export interface ContextBuilderLimits {
  /** Hard cap on the projected content length, to bound prompt size. */
  maxContentChars: number;
}

const DEFAULT_LIMITS: ContextBuilderLimits = { maxContentChars: 12_000 };

/**
 * Builds tutor context exclusively from a PUBLISHED module version, its ordered
 * block text projections, and its tracked sources. Drafts and archived versions
 * are refused, and no other module's content can leak in.
 */
export class PrismaModuleContextBuilder implements ModuleContextBuilder {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly limits: ContextBuilderLimits = DEFAULT_LIMITS,
  ) {}

  async buildForPublishedVersion(moduleVersionId: string): Promise<ModuleContext | null> {
    const version = await this.prisma.moduleVersion.findUnique({
      where: { id: moduleVersionId },
      include: {
        module: true,
        blocks: { orderBy: { position: "asc" } },
        sources: true,
      },
    });

    // Refuse anything that is not currently published.
    if (!version || version.status !== "PUBLISHED") return null;

    const projected = version.blocks
      .map((b) => projectBlockText(b.type, b.payload))
      .filter((t) => t.length > 0)
      .join("\n\n");

    const content =
      projected.length > this.limits.maxContentChars
        ? projected.slice(0, this.limits.maxContentChars)
        : projected;

    return {
      moduleVersionId: version.id,
      moduleSlug: version.module.slug,
      title: version.title,
      summary: version.summary,
      content,
      sources: version.sources.map((s) => ({
        id: s.id,
        label: s.label,
        url: s.url ?? undefined,
        citation: s.citation ?? undefined,
      })),
    };
  }
}
