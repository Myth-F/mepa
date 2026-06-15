## Why

The catalogue lists every published module in a single unpaginated, unsearchable,
uncached query and the data model has no taxonomy. This is unusable beyond a few dozen
modules and collapses (rendering and discovery) well before 1000 modules. The
task-allocation plan already assigns a "Recherche" / "Table des cours" workstream, but it
is unspecified. Newcomers also arrive on a landing page that does not surface any actual
content to explore. We need a discovery capability that scales, helps a general-public
visitor find relevant modules quickly, and gently converts first-time visitors into
account holders without blocking access.

## What Changes

- Replace the unbounded catalogue with a **paginated (keyset), sortable, faceted** browse
  experience served from an indexed, denormalized search document.
- Add **classification** to modules: category, tags, level, estimated duration, language.
- Add **full-text search** (French, accent/case-insensitive, ranked) over title, summary
  and the projected body text of blocks, behind a **provider-neutral `SearchPort`**
  (default PostgreSQL adapter; an external engine can be swapped in later).
- Add a **landing-page discovery showcase** for newcomers: curated *featured* modules with
  an algorithmic fallback (popular/new), varied for first-time visitors via a strictly
  functional cookie (no tracking, no PII — CNIL-friendly).
- Add a **non-blocking sign-in invitation**: opening a module from the showcase still works
  without an account, but invites the visitor to create one to keep their progress.
- Add **returning-visitor entry points**: continue an in-progress module and see
  recommendations.
- Add **shareable, accessible discovery**: search/filter/sort state encoded in the URL,
  results announced to assistive technologies, a guiding no-results state, plus a sitemap
  and per-category pages for public-good discoverability (SEO).
- Build/refresh the search document **at publication** (reusing the block text projection
  that already feeds the AI boundary) and provide a **recompute** command.

Non-goals: an external search engine in this change (kept possible via `SearchPort`),
personalized ML recommendations (use simple popularity/category heuristics), cross-user
social discovery, third-party analytics, and consent-gated tracking.

## Capabilities

### New Capabilities

- `course-discovery`: Paginated/faceted/sorted catalogue, French full-text search behind a
  neutral `SearchPort`, a landing discovery showcase for newcomers and returning visitors,
  and the publication-time search document plus recompute.

### Modified Capabilities

- `staff-module-authoring`: Staff classify modules (category, tags, level, duration,
  language) and can feature a module; publication builds/refreshes its discovery document.
- `learner-experience`: The landing page surfaces discoverable modules; opening a module
  as an anonymous/first-time visitor still works and adds a non-blocking invitation to
  create an account to keep progress; returning visitors get continue/recommended entries.

## Impact

Adds taxonomy tables/fields, a `module_search_document` denormalized table with a GIN
full-text index and supporting btree indexes, a `course-discovery` module
(`src/modules/discovery`) with a pure-domain `SearchPort` + PostgreSQL adapter, publication
hooks, a rebuilt catalogue, landing showcase, and authoring classification UI. Brings the
leaderboard-style data concerns plus a public **sitemap** and **category pages**. No new
runtime service is required (PostgreSQL FTS). Accessibility scope grows (search form,
faceted filters, live result counts). No change to media, deployment, gamification, or the
AI boundary beyond reusing the existing text projection.
