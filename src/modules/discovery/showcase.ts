import type { PrismaClient, CourseLevel } from "@/generated/prisma";

// Landing-page discovery helpers. No tracking or personal data is used to build
// the public showcase; featured (editorial) modules come first, then a popular/
// recent fill. (Daily rotation of the fill is a documented future refinement.)

export interface ShowcaseItem {
  slug: string;
  title: string;
  summary: string;
  categoryName: string | null;
  level: CourseLevel | null;
  estimatedMinutes: number | null;
}

function toItem(doc: {
  slug: string;
  title: string;
  summary: string;
  categoryName: string | null;
  level: CourseLevel | null;
  estimatedMinutes: number | null;
}): ShowcaseItem {
  return {
    slug: doc.slug,
    title: doc.title,
    summary: doc.summary,
    categoryName: doc.categoryName,
    level: doc.level,
    estimatedMinutes: doc.estimatedMinutes,
  };
}

export async function getShowcase(prisma: PrismaClient, limit = 6): Promise<ShowcaseItem[]> {
  const featured = await prisma.moduleSearchDocument.findMany({
    where: { module: { featured: true } },
    orderBy: { module: { featuredRank: "asc" } },
    take: limit,
  });

  const picked = [...featured];
  if (picked.length < limit) {
    const fill = await prisma.moduleSearchDocument.findMany({
      where: { moduleId: { notIn: picked.map((p) => p.moduleId) } },
      orderBy: [{ popularity: "desc" }, { publishedAt: "desc" }],
      take: limit - picked.length,
    });
    picked.push(...fill);
  }
  return picked.map(toItem);
}

export interface ContinueItem {
  slug: string;
  title: string;
}

/** Modules the learner has started (quiz/dilemma activity) but not completed. */
export async function getContinueModules(
  prisma: PrismaClient,
  learnerId: string,
  limit = 3,
): Promise<ContinueItem[]> {
  const [attempts, votes, completions] = await Promise.all([
    prisma.quizAttempt.findMany({
      where: { learnerId },
      select: { moduleVersionId: true, createdAt: true },
    }),
    prisma.dilemmaVote.findMany({
      where: { learnerId },
      select: { moduleVersionId: true, createdAt: true },
    }),
    prisma.moduleCompletion.findMany({
      where: { learnerId },
      select: { moduleVersionId: true },
    }),
  ]);

  const completed = new Set(completions.map((c) => c.moduleVersionId));
  const recent = [...attempts, ...votes].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );

  const orderedVersionIds: string[] = [];
  const seen = new Set<string>();
  for (const r of recent) {
    if (completed.has(r.moduleVersionId) || seen.has(r.moduleVersionId)) continue;
    seen.add(r.moduleVersionId);
    orderedVersionIds.push(r.moduleVersionId);
    if (orderedVersionIds.length >= limit) break;
  }
  if (orderedVersionIds.length === 0) return [];

  const versions = await prisma.moduleVersion.findMany({
    where: { id: { in: orderedVersionIds }, status: "PUBLISHED" },
    include: { module: true },
  });
  const byId = new Map(versions.map((v) => [v.id, v]));
  return orderedVersionIds
    .map((id) => byId.get(id))
    .filter((v): v is NonNullable<typeof v> => Boolean(v))
    .map((v) => ({ slug: v.module.slug, title: v.title }));
}
