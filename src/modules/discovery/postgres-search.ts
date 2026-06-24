import { Prisma, type PrismaClient } from "@/generated/prisma";
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  type SearchHit,
  type SearchPort,
  type SearchQuery,
  type SearchResponse,
} from "./port";

interface HitRow {
  moduleId: string;
  slug: string;
  title: string;
  summary: string;
  categorySlug: string | null;
  categoryName: string | null;
  level: SearchHit["level"];
  estimatedMinutes: number | null;
  tags: string[];
  popularity: number;
  publishedAt: Date;
}

/**
 * PostgreSQL full-text discovery adapter. Reads the denormalized
 * `module_search_document`, with accent/case-insensitive French search
 * (`websearch_to_tsquery` + `unaccent`), weighted relevance (`ts_rank`), facet
 * filtering, and pagination. All user input is passed as bound parameters.
 */
export class PostgresSearch implements SearchPort {
  constructor(private readonly prisma: PrismaClient) {}

  async search(query: SearchQuery): Promise<SearchResponse> {
    const page = Math.max(1, Math.trunc(query.page ?? 1));
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, Math.trunc(query.pageSize ?? DEFAULT_PAGE_SIZE)),
    );
    const offset = (page - 1) * pageSize;
    const sort = query.sort ?? "relevance";
    const f = query.filters ?? {};

    const q = query.q?.trim();
    const hasQ = Boolean(q);
    const tsquery = Prisma.sql`websearch_to_tsquery('french', unaccent(${q ?? ""}))`;

    const common: Prisma.Sql[] = [Prisma.sql`TRUE`];
    if (hasQ) common.push(Prisma.sql`d."searchVector" @@ ${tsquery}`);
    if (f.maxMinutes) common.push(Prisma.sql`d."estimatedMinutes" <= ${f.maxMinutes}`);

    const categoryCondition =
      f.categories && f.categories.length > 0
        ? Prisma.sql`d."categorySlug" IN (${Prisma.join(f.categories)})`
        : null;
    const levelCondition =
      f.levels && f.levels.length > 0
        ? Prisma.sql`d."level"::text IN (${Prisma.join(f.levels)})`
        : null;
    const tagCondition =
      f.tags && f.tags.length > 0 ? Prisma.sql`d."tags" @> ${f.tags}::text[]` : null;

    const conditions = [...common];
    if (categoryCondition) conditions.push(categoryCondition);
    if (levelCondition) conditions.push(levelCondition);
    if (tagCondition) conditions.push(tagCondition);
    const where = Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}`;

    // A facet excludes its own dimension so selecting one value does not hide
    // the alternatives that can be added with OR semantics.
    const categoryFacet = [...common];
    if (levelCondition) categoryFacet.push(levelCondition);
    if (tagCondition) categoryFacet.push(tagCondition);
    const levelFacet = [...common];
    if (categoryCondition) levelFacet.push(categoryCondition);
    if (tagCondition) levelFacet.push(tagCondition);
    const tagFacet = [...common];
    if (categoryCondition) tagFacet.push(categoryCondition);
    if (levelCondition) tagFacet.push(levelCondition);
    const whereForCategories = Prisma.sql`WHERE ${Prisma.join(categoryFacet, " AND ")}`;
    const whereForLevels = Prisma.sql`WHERE ${Prisma.join(levelFacet, " AND ")}`;
    const whereForTags = Prisma.sql`WHERE ${Prisma.join(tagFacet, " AND ")}`;

    let orderBy: Prisma.Sql;
    switch (sort) {
      case "recent":
        orderBy = Prisma.sql`ORDER BY d."publishedAt" DESC NULLS LAST, d."title" ASC`;
        break;
      case "popular":
        orderBy = Prisma.sql`ORDER BY d."popularity" DESC, d."publishedAt" DESC`;
        break;
      case "title":
        orderBy = Prisma.sql`ORDER BY d."title" ASC`;
        break;
      case "relevance":
      default:
        orderBy = hasQ
          ? Prisma.sql`ORDER BY ts_rank(d."searchVector", ${tsquery}) DESC, d."publishedAt" DESC`
          : Prisma.sql`ORDER BY d."popularity" DESC, d."title" ASC`;
        break;
    }

    const [hits, totalRows, categoryRows, levelRows, tagRows] = await Promise.all([
      this.prisma.$queryRaw<HitRow[]>(Prisma.sql`
        SELECT d."moduleId", d."slug", d."title", d."summary", d."categorySlug",
               d."categoryName", d."level", d."estimatedMinutes", d."tags",
               d."popularity", d."publishedAt"
        FROM "module_search_document" d
        ${where}
        ${orderBy}
        LIMIT ${pageSize} OFFSET ${offset}
      `),
      this.prisma.$queryRaw<{ count: bigint }[]>(Prisma.sql`
        SELECT count(*)::bigint AS count FROM "module_search_document" d ${where}
      `),
      this.prisma.$queryRaw<{ value: string; label: string; count: bigint }[]>(Prisma.sql`
        SELECT d."categorySlug" AS value, d."categoryName" AS label, count(*)::bigint AS count
        FROM "module_search_document" d ${whereForCategories} AND d."categorySlug" IS NOT NULL
        GROUP BY d."categorySlug", d."categoryName" ORDER BY count DESC, label ASC
      `),
      this.prisma.$queryRaw<{ value: string; count: bigint }[]>(Prisma.sql`
        SELECT d."level"::text AS value, count(*)::bigint AS count
        FROM "module_search_document" d ${whereForLevels} AND d."level" IS NOT NULL
        GROUP BY d."level" ORDER BY count DESC
      `),
      this.prisma.$queryRaw<{ value: string; count: bigint }[]>(Prisma.sql`
        SELECT t AS value, count(*)::bigint AS count
        FROM "module_search_document" d, unnest(d."tags") AS t
        ${whereForTags}
        GROUP BY t ORDER BY count DESC, value ASC LIMIT 30
      `),
    ]);

    return {
      hits,
      total: Number(totalRows[0]?.count ?? 0),
      page,
      pageSize,
      facets: {
        categories: categoryRows.map((r) => ({
          value: r.value,
          label: r.label,
          count: Number(r.count),
        })),
        levels: levelRows.map((r) => ({
          value: r.value,
          label: r.value,
          count: Number(r.count),
        })),
        tags: tagRows.map((r) => ({
          value: r.value,
          label: r.value,
          count: Number(r.count),
        })),
      },
    };
  }
}

let cached: PostgresSearch | undefined;
export function getSearch(prisma: PrismaClient): SearchPort {
  cached ??= new PostgresSearch(prisma);
  return cached;
}
