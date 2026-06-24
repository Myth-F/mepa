import type { MetadataRoute } from "next";
import { prisma } from "@/shared/db/prisma";
import { env } from "@/shared/config/env";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, modules] = await Promise.all([
    prisma.category.findMany({
      where: { versions: { some: { status: "PUBLISHED" } } },
      select: { slug: true, createdAt: true },
    }),
    prisma.moduleSearchDocument.findMany({
      select: { slug: true, publishedAt: true },
    }),
  ]);
  const base = env.APP_URL.replace(/\/$/, "");

  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/modules`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/accessibilite`, changeFrequency: "monthly", priority: 0.3 },
    ...categories.map((category) => ({
      url: `${base}/categories/${category.slug}`,
      lastModified: category.createdAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...modules.map((module) => ({
      url: `${base}/modules/${module.slug}`,
      lastModified: module.publishedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
