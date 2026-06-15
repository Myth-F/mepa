## Context

Today `/modules` runs one unbounded `findMany` of all published `ModuleVersion`s, with no
search, facets, pagination or cache, and the schema carries no taxonomy. Module content is
stored as immutable published versions whose blocks already expose a normalized text
projection (`projectBlockText`) used by the AI boundary. The platform is a single-VPS
modular monolith with strict privacy (email never exposed; CNIL/Education context) and RGAA
accessibility targets. Discovery must scale to 1000+ modules on PostgreSQL alone, stay
provider-neutral, and keep domain logic free of Next.js/Prisma.

## Goals / Non-Goals

**Goals:**

- Make the catalogue usable and fast at 1000+ modules (pagination, facets, sorting).
- Provide relevant French full-text search over title, summary and body.
- Help newcomers discover content from the landing page and convert without friction.
- Keep search swappable (PostgreSQL now, external engine later) behind one port.
- Preserve privacy: no third-party analytics, no PII in search or first-visit handling.

**Non-Goals:**

- An external search engine, ML personalization, social discovery, consent-gated tracking.

## Decisions

### Serve discovery from a denormalized `module_search_document`

Maintain one row per module representing its **current published version**: slug, title,
summary, category, tags, level, estimated duration, language, `publishedAt`, a popularity
counter, and a weighted `tsvector` (A=title, B=summary, C=body via `projectBlockText`).
The catalogue, facets and search all read this single indexed table instead of joining
versions and blocks per request. The document is **built/refreshed inside the publish
transaction** and **deleted when a module has no published version**. A `recompute` command
rebuilds all documents (with a one-time backfill for existing modules).

This makes reads cheap and keeps the search corpus consistent with published content only.
Drift is prevented by writing the document in the same transaction as publication and by
the recompute command.

### Access search through a provider-neutral `SearchPort`

Define `SearchPort.search({ query, filters, sort, page })` returning `{ results, total,
facets }`, with a default **PostgreSQL adapter** (FTS + `unaccent` + `french` dictionary,
`ts_rank` relevance, filtered by facets, keyset/offset pagination). The catalogue UI and
domain depend only on the port, so a Meilisearch/Typesense adapter can replace it later
without touching the UI — the same pattern as `MediaStoragePort` and the tutor boundary.

### Keyset pagination, indexes and ISR caching

Default sort is relevance for searches and `publishedAt desc` for browse, with options
recent / popularity / A–Z. Browse pagination uses **keyset** on `(publishedAt, id)` (stable
for deep pages); search pagination uses ranked offset within a bounded window. Add a GIN
index on the `tsvector`, btree indexes on `publishedAt`, `category`, `level`, and the
popularity counter. The catalogue and landing showcase move from `force-dynamic` to
**incremental static regeneration** (revalidate on publish), since published content changes
rarely.

### Classification lives on the version; curation lives on the module

Category, tags, level, estimated duration and language are set on `ModuleVersion` (so each
immutable published snapshot is self-consistent). **Featured** status and rank live on
`Module` (stable editorial curation, independent of version churn). Categories and tags are
first-class records (slug + name) to power facet pages and a sitemap.

### Landing showcase: curated first, algorithmic fallback, no tracking

The showcase shows staff-**featured** modules first, then fills with an algorithmic set
(popular and recent) to reach a target count. To avoid `ORDER BY random()` at scale, the
"discover something new" selection is a **daily-rotated sample drawn cheaply** (bounded
random offset over the document count) and cached via ISR. First-time visitors are detected
with a **strictly functional cookie** (e.g. `mepa_seen`), carrying no identifier and no
behavioural data, so it needs no consent banner under CNIL guidance; it only varies the
landing copy (onboarding emphasis vs. returning).

### Opening a module never blocks; it invites

Consistent with the learner-experience principle that a visitor can start a published module
without an account, clicking a showcased module **opens it** and surfaces a **non-blocking
invitation** to create an account to keep progress. A returning, authenticated visitor
instead sees "continue" (in-progress modules) and category-based recommendations. A hard
sign-in gate was rejected as hostile to a general-public audience and inconsistent with the
existing optional-account design (recorded as an Open Question if the product owner prefers a
gate).

### Accessibility, shareability and SEO

The search form has a real label and submit; results announce their count via a live region;
facets are keyboard-operable labelled controls; rank/relevance is never colour-only; a
no-results state guides the user (check spelling, remove a filter, browse categories).
Single-value facets (category, level) are selectable links; **tags are multi-select
checkboxes** (a learner may combine several tags), submitted via the search form so the
selection stays encoded in the URL.
Search/filter/sort state is **encoded in the URL** (shareable, back-button friendly). Public
**category pages** and a **sitemap** of published modules and categories improve discovery
and SEO for a public-good service.

## Risks / Trade-offs

- [Search document drifts from content] -> written in the publish transaction; `recompute`
  rebuilds and an integrity test compares.
- [`ORDER BY random()` is slow at scale] -> curated featured + daily-rotated bounded-offset
  sample, cached.
- [Facet counts get expensive] -> computed from the indexed document table and cached via ISR.
- [Editable classification vs immutable versions] -> classification on the version, curation
  on the module.
- [Lock-in to PostgreSQL search] -> isolated behind `SearchPort`; adapter swap is contained.
- [First-visit cookie perceived as tracking] -> strictly functional, no identifier, documented
  CNIL rationale; no third-party analytics anywhere in discovery.
- [French relevance quality] -> `unaccent` + `french` dictionary + weighted vector + `ts_rank`;
  popularity as a secondary boost.

## Migration Plan

1. Expand-only migration: taxonomy tables/fields, `featured` on module, and
   `module_search_document` with indexes.
2. Hook document build/refresh into publish/unpublish; deploy.
3. Run `recompute --backfill` once to populate documents for existing published modules.
4. Ship catalogue v2 (port-backed, paginated, faceted, ISR), then the landing showcase and
   authoring classification.

Rollback: discovery is additive; reverting the catalogue route to the previous listing and
removing showcase/search leaves modules and publication intact. Documents/taxonomy can be
dropped in a later contract migration.

## Open Questions

- Sign-in on showcase click: non-blocking invitation (recommended, chosen) vs. a soft gate
  after the first module. Default: non-blocking invitation.
- Featured curation: manual only (chosen) vs. also scheduled/auto-rotated editorial slots.
- Recommendations depth: category/popularity heuristics (chosen) vs. richer "related by
  shared tags / next in a learning path" — proposed as a follow-up once learning paths exist.
- Search pagination beyond the ranked window: cap depth vs. switch to a cursor on
  `(rank, id)`; revisit if deep search paging is actually used.
