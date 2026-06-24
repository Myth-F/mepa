import type { CourseLevel } from "@/generated/prisma";

// Provider-neutral discovery contract. The catalogue UI depends only on this
// port, so the PostgreSQL full-text implementation can be replaced by an external
// engine (Meilisearch/Typesense) without touching the UI or domain — the same
// pattern as MediaStoragePort and the tutor boundary.

export type SearchSort = "relevance" | "recent" | "popular" | "title";

export const SEARCH_SORTS: SearchSort[] = ["relevance", "recent", "popular", "title"];

export interface SearchFilters {
  categories?: string[]; // category slugs, OR within this dimension
  levels?: CourseLevel[]; // OR within this dimension
  tags?: string[];
  maxMinutes?: number;
}

export interface SearchQuery {
  q?: string;
  filters?: SearchFilters;
  sort?: SearchSort;
  page?: number;
  pageSize?: number;
}

export interface SearchHit {
  moduleId: string;
  slug: string;
  title: string;
  summary: string;
  categorySlug: string | null;
  categoryName: string | null;
  level: CourseLevel | null;
  estimatedMinutes: number | null;
  tags: string[];
  popularity: number;
  publishedAt: Date;
}

export interface FacetCount {
  value: string;
  label: string;
  count: number;
}

export interface SearchFacets {
  categories: FacetCount[];
  levels: FacetCount[];
  tags: FacetCount[];
}

export interface SearchResponse {
  hits: SearchHit[];
  total: number;
  page: number;
  pageSize: number;
  facets: SearchFacets;
}

export interface SearchPort {
  search(query: SearchQuery): Promise<SearchResponse>;
}

export const DEFAULT_PAGE_SIZE = 12;
export const MAX_PAGE_SIZE = 48;
