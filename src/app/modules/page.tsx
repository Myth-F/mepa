import Link from "next/link";
import type { Metadata } from "next";
import type { Route } from "next";
import { prisma } from "@/shared/db/prisma";
import { Breadcrumb } from "@/shared/ui/breadcrumb";
import { getSearch } from "@/modules/discovery/postgres-search";
import {
  SEARCH_SORTS,
  type SearchSort,
  type SearchFilters,
  DEFAULT_PAGE_SIZE,
} from "@/modules/discovery/port";
import type { CourseLevel } from "@/generated/prisma";
import { ActiveFiltersBar, type ActiveFilterItem } from "./active-filters-bar";
import { formatPublishedDate } from "@/modules/discovery/format-date";

export const metadata: Metadata = {
  title: "Comprendre l’IA",
  alternates: { canonical: "/modules" },
};
export const dynamic = "force-dynamic";
export const revalidate = 0;

const LEVEL_LABELS: Record<CourseLevel, string> = {
  BEGINNER: "Débutant",
  INTERMEDIATE: "Intermédiaire",
  ADVANCED: "Avancé",
};

const SORT_LABELS: Record<SearchSort, string> = {
  relevance: "Pertinence",
  recent: "Plus récents",
  popular: "Plus consultés",
  title: "A–Z",
};

type RawParams = {
  q?: string;
  category?: string | string[];
  level?: string | string[];
  sort?: string;
  page?: string;
  tags?: string | string[];
};

type QueryValue = Record<string, string | string[]>;

interface CatalogueState {
  q: string;
  categories: string[];
  levels: CourseLevel[];
  sort: SearchSort;
  tags: string[];
  page: number;
}

function isSort(v: string | undefined): v is SearchSort {
  return !!v && (SEARCH_SORTS as string[]).includes(v);
}
function isLevel(v: string | undefined): v is CourseLevel {
  return v === "BEGINNER" || v === "INTERMEDIATE" || v === "ADVANCED";
}
function toValues(v: string | string[] | undefined): string[] {
  if (Array.isArray(v)) return v.filter(Boolean);
  return v ? [v] : [];
}

/** Build a /modules query object from the state plus overrides (page resets unless set). */
function buildQuery(state: CatalogueState, overrides: Partial<CatalogueState> = {}): QueryValue {
  const merged = { ...state, page: 1, ...overrides };
  const query: QueryValue = {};
  if (merged.q) query.q = merged.q;
  if (merged.categories.length > 0) query.category = merged.categories;
  if (merged.levels.length > 0) query.level = merged.levels;
  if (merged.sort) query.sort = merged.sort;
  if (merged.tags.length > 0) query.tags = merged.tags;
  if (merged.page > 1) query.page = String(merged.page);
  return query;
}

function buildHref(state: CatalogueState, overrides: Partial<CatalogueState> = {}): string {
  const values = buildQuery(state, overrides);
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (Array.isArray(value)) value.forEach((item) => params.append(key, item));
    else params.set(key, value);
  }
  const query = params.toString();
  return query ? `/modules?${query}` : "/modules";
}

const MODULES: Route = "/modules";

export default async function CataloguePage({
  searchParams,
}: {
  searchParams: Promise<RawParams>;
}) {
  const params = await searchParams;
  const state: CatalogueState = {
    q: params.q?.trim() ?? "",
    categories: toValues(params.category),
    levels: toValues(params.level).filter(isLevel),
    sort: isSort(params.sort) ? params.sort : "relevance",
    tags: toValues(params.tags),
    page: Math.max(1, Number(params.page) || 1),
  };

  const filters: SearchFilters = {};
  if (state.categories.length > 0) filters.categories = state.categories;
  if (state.levels.length > 0) filters.levels = state.levels;
  if (state.tags.length > 0) filters.tags = state.tags;

  const result = await getSearch(prisma).search({
    q: state.q,
    filters,
    sort: state.sort,
    page: state.page,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const hasFilters = Boolean(
    state.q ||
    state.categories.length > 0 ||
    state.levels.length > 0 ||
    state.tags.length > 0 ||
    state.sort !== "relevance",
  );

  const activeItems: ActiveFilterItem[] = [];
  if (state.q) {
    activeItems.push({
      key: "query",
      label: `Recherche : ${state.q}`,
      removeHref: buildHref(state, { q: "" }),
    });
  }
  for (const category of state.categories) {
    const label =
      result.facets.categories.find((item) => item.value === category)?.label ?? category;
    activeItems.push({
      key: `category-${category}`,
      label,
      removeHref: buildHref(state, {
        categories: state.categories.filter((value) => value !== category),
      }),
    });
  }
  for (const level of state.levels) {
    activeItems.push({
      key: `level-${level}`,
      label: LEVEL_LABELS[level],
      removeHref: buildHref(state, {
        levels: state.levels.filter((value) => value !== level),
      }),
    });
  }
  for (const tag of state.tags) {
    activeItems.push({
      key: `tag-${tag}`,
      label: tag,
      removeHref: buildHref(state, { tags: state.tags.filter((value) => value !== tag) }),
    });
  }
  if (state.sort !== "relevance") {
    activeItems.push({
      key: "sort",
      label: `Tri : ${SORT_LABELS[state.sort]}`,
      removeHref: buildHref(state, { sort: "relevance" }),
    });
  }

  return (
    <div className="container">
      <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Comprendre l’IA" }]} />
      <div className="page-heading">
        <p className="eyebrow">Choisissez un sujet</p>
        <h1>Comprendre l’IA, un enjeu à la fois</h1>
        <p>
          Recherchez un sujet ou explorez par thème. Vous pouvez commencer sans créer de compte.
        </p>
      </div>

      <form className="search-bar" role="search" method="get" action="/modules">
        <label htmlFor="q">Rechercher un module</label>
        <div className="search-bar__row">
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={state.q}
            placeholder="Ex. données personnelles, biais, recours…"
            autoComplete="off"
          />
          {state.categories.map((category) => (
            <input key={category} type="hidden" name="category" value={category} />
          ))}
          {state.levels.map((level) => (
            <input key={level} type="hidden" name="level" value={level} />
          ))}
          <input type="hidden" name="sort" value={state.sort} />
          <button className="btn" type="submit">
            Rechercher
          </button>
        </div>

        {(result.facets.tags.length > 0 || state.tags.length > 0) && (
          <fieldset className="tag-filter">
            <legend>Mots-clés</legend>
            <p className="tag-filter__hint" id="tag-hint">
              Cochez un ou plusieurs mots-clés, puis lancez la recherche.
            </p>
            <div className="tag-filter__options" aria-describedby="tag-hint">
              {result.facets.tags.map((tag) => (
                <label className="tag-checkbox" key={tag.value}>
                  <input
                    type="checkbox"
                    name="tags"
                    value={tag.value}
                    defaultChecked={state.tags.includes(tag.value)}
                  />
                  <span>{tag.value}</span>
                  <span className="tag-checkbox__count" aria-hidden="true">
                    {tag.count}
                  </span>
                </label>
              ))}
              {/* Keep selected tags that are no longer in the facet list checkable. */}
              {state.tags
                .filter((t) => !result.facets.tags.some((f) => f.value === t))
                .map((t) => (
                  <label className="tag-checkbox" key={t}>
                    <input type="checkbox" name="tags" value={t} defaultChecked />
                    <span>{t}</span>
                  </label>
                ))}
            </div>
          </fieldset>
        )}
      </form>

      <ActiveFiltersBar
        items={activeItems}
        total={result.total}
        resetHref="/modules"
      />

      <div className="catalogue">
        <aside className="catalogue__facets" aria-label="Filtrer les modules">
          <FacetGroup
            title="Thème"
            state={state}
            paramKey="category"
            active={state.categories}
            options={result.facets.categories.map((c) => ({
              value: c.value,
              label: c.label,
              count: c.count,
            }))}
          />
          <FacetGroup
            title="Niveau"
            state={state}
            paramKey="level"
            active={state.levels}
            options={result.facets.levels.map((l) => ({
              value: l.value,
              label: LEVEL_LABELS[l.value as CourseLevel] ?? l.value,
              count: l.count,
            }))}
          />
          {hasFilters && (
            <Link className="text-link" href={{ pathname: MODULES, query: {} }}>
              Réinitialiser les filtres
            </Link>
          )}
        </aside>

        <div className="catalogue__results">
          <div className="catalogue__toolbar">
            <p role="status" aria-live="polite" className="catalogue__count">
              {result.total === 0
                ? "Aucun module trouvé"
                : `${result.total} module${result.total > 1 ? "s" : ""}`}
              {state.q && ` pour « ${state.q} »`}
            </p>
            <nav className="sort" aria-label="Trier les résultats">
              <span className="sort__label">Trier&nbsp;:</span>
              {SEARCH_SORTS.map((s) => (
                <Link
                  key={s}
                  className="sort__option"
                  prefetch={false}
                  href={{ pathname: MODULES, query: buildQuery(state, { sort: s }) }}
                  aria-current={s === state.sort ? "true" : undefined}
                >
                  {SORT_LABELS[s]}
                </Link>
              ))}
            </nav>
          </div>

          {result.total === 0 ? (
            <div className="empty-state">
              <h2>Aucun module ne correspond</h2>
              <p>Vérifiez l’orthographe, retirez un filtre, ou explorez tous les thèmes.</p>
              <Link className="text-link" href={{ pathname: MODULES, query: {} }}>
                Voir tous les modules
              </Link>
            </div>
          ) : (
            <ul className="module-list" aria-label="Résultats">
              {result.hits.map((hit) => (
                <li key={hit.moduleId}>
                  <article className="module-card">
                    <div className="module-card__content">
                      <p className="module-card__meta">
                        {hit.categoryName ?? "Module"}
                        {hit.level ? ` · ${LEVEL_LABELS[hit.level]}` : ""}
                        {hit.estimatedMinutes ? ` · ${hit.estimatedMinutes} min` : ""}
                      </p>
                      <p className="module-card__date">
                        <time dateTime={hit.publishedAt.toISOString()}>
                          {formatPublishedDate(hit.publishedAt)}
                        </time>
                      </p>
                      <h2>
                        <Link href={`/modules/${hit.slug}`}>{hit.title}</Link>
                      </h2>
                      {hit.summary && <p>{hit.summary}</p>}
                    </div>
                    <Link className="module-card__link" href={`/modules/${hit.slug}`}>
                      Commencer <span aria-hidden="true">→</span>
                      <span className="sr-only"> le module « {hit.title} »</span>
                    </Link>
                  </article>
                </li>
              ))}
            </ul>
          )}

          {totalPages > 1 && (
            <nav className="pagination" aria-label="Pages de résultats">
              {state.page > 1 && (
                <Link
                  className="pagination__link"
                  href={{ pathname: MODULES, query: buildQuery(state, { page: state.page - 1 }) }}
                >
                  ← Précédent
                </Link>
              )}
              <span className="pagination__status">
                Page {state.page} sur {totalPages}
              </span>
              {state.page < totalPages && (
                <Link
                  className="pagination__link"
                  href={{ pathname: MODULES, query: buildQuery(state, { page: state.page + 1 }) }}
                >
                  Suivant →
                </Link>
              )}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}

function FacetGroup({
  title,
  state,
  paramKey,
  active,
  options,
}: {
  title: string;
  state: CatalogueState;
  paramKey: "category" | "level";
  active: string[];
  options: { value: string; label: string; count: number }[];
}) {
  if (options.length === 0 && active.length === 0) return null;
  return (
    <section className="facet">
      <h2 className="facet__title">{title}</h2>
      <ul className="facet__list">
        {options.map((opt) => {
          const isActive = active.includes(opt.value);
          const nextValues = isActive
            ? active.filter((value) => value !== opt.value)
            : [...active, opt.value];
          const override =
            paramKey === "category"
              ? { categories: nextValues }
              : { levels: nextValues.filter(isLevel) };
          return (
            <li key={opt.value}>
              <Link
                className="facet__option"
                prefetch={false}
                href={{ pathname: "/modules" as Route, query: buildQuery(state, override) }}
                aria-current={isActive ? "true" : undefined}
              >
                <span>{opt.label}</span>
                <span className="facet__count" aria-hidden="true">
                  {opt.count}
                </span>
                {isActive && (
                  <span className="sr-only"> (filtre actif, sélectionner pour retirer)</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
