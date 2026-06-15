## 1. Discovery Data Model And Document

- [x] 1.1 Add taxonomy (Category, version fields: category, level, estimatedMinutes, language, tags), `featured`/`featuredRank` on Module, and a `module_search_document` table (weighted `tsvector`, classification, popularity, publishedAt) with a Prisma migration
- [x] 1.2 Add a GIN index on the search vector and btree indexes on publishedAt, category, level, and popularity; enable the `unaccent` extension and `french` text configuration
- [x] 1.3 Build/refresh the discovery document inside the publish transaction (reusing `projectBlockText`) and delete it when no published version remains
- [x] 1.4 Implement a `recompute` command (`npm run search:recompute`) that rebuilds all documents from published content
- [~] 1.5 Add unit/integration tests for document build, removal on unpublish, and recompute equivalence (unit test for the pure body assembly added; DB-backed build/removal/recompute verified manually against PostgreSQL — automated integration tests pending CI DB harness)

## 2. Search Port And PostgreSQL Adapter

- [x] 2.1 Define the provider-neutral `SearchPort` (`search({ q, filters, sort, page }) -> { hits, total, facets }`)
- [x] 2.2 Implement the PostgreSQL adapter: French accent/case-insensitive full-text query, `ts_rank` relevance, facet filtering (category/level/tags/duration), sorting (relevance/recent/popularity/A–Z), and pagination
- [~] 2.3 Add unit/integration tests for ranking, accent/case insensitivity, facet filtering, published-only results, and empty-result behavior (verified live via SQL + running app; automated adapter integration tests pending CI DB harness)

## 3. Catalogue v2

- [x] 3.1 Rebuild `/modules` to read through `SearchPort`: paginated, sortable, with a labelled search form and facet filters
- [x] 3.1b Present tag filtering as multi-select checkboxes (refine via AND `@>`, state kept in the URL, labelled fieldset, keyboard-operable); tag facet exposed by the SearchPort
- [x] 3.2 Encode search/filter/sort state in the URL; add an accessible result-count live region and a guiding no-results state
- [~] 3.3 Verify keyboard operation and non-color-only relevance; catalogue uses indexed queries + pagination (it remains request-rendered because results depend on URL search params; ISR is applied to static surfaces, not per-query search)
- [ ] 3.4 Add Playwright coverage for search, facet filtering, sorting, pagination, shareable URL state, and no-results

## 4. Landing Showcase And Visitor Journey

- [x] 4.1 Build the landing discovery showcase: featured-first with popular/recent fallback, drawn cheaply (no `ORDER BY random()`)
- [x] 4.2 Detect first-time visitors with a strictly functional cookie (no identifier, no behavioural data) to vary onboarding copy; CNIL rationale documented in middleware
- [x] 4.3 Add the non-blocking, dismissible account invitation when an anonymous visitor opens a module; suppress it for authenticated learners
- [x] 4.4 Add returning-visitor entry points: continue an in-progress module and showcase recommendations
- [ ] 4.5 Add Playwright coverage for showcase rendering, first-visit variation, non-blocking open + invitation, and returning-visitor continuation

## 5. Authoring Integration

- [~] 5.1 Add classification (category, tags, level, duration, language) + featured curation to authoring: wired into `ModuleService.createModule`/`setDraftMetadata` and the seed; the `/admin` editor UI itself is still pending (bootstrap tasks 3.1/3.2)
- [~] 5.2 Add tests for classification persistence, featured curation, and that publication refreshes the discovery document (publication→document refresh verified live; automated tests pending CI DB harness)

## 6. Discoverability, Privacy And Verification

- [ ] 6.1 Add public category pages and a sitemap of published modules and categories; set canonical metadata
- [x] 6.2 No PII and no third-party tracking in search or first-visit handling (functional cookie carries no identifier; search queries are not stored against identities)
- [ ] 6.3 Run an RGAA check on the search form, facets, showcase and no-results state; record results
- [~] 6.4 Run the full automated suite and production build (green), and document the search ranking, facets, featured curation, and recompute (in design.md); per-action point/level docs pending
