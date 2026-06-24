export interface ActiveFilterItem {
  key: string;
  label: string;
  removeHref: string;
}

export function ActiveFiltersBar({
  items,
  total,
  resetHref,
}: {
  items: ActiveFilterItem[];
  total: number;
  resetHref: string;
}) {
  if (items.length === 0) return null;
  return (
    <section className="active-filters" aria-label="Filtres et tri actifs">
      <div>
        <strong>
          {total} module{total === 1 ? "" : "s"}
        </strong>
        <ul>
          {items.map((item) => (
            <li key={item.key}>
              <a
                href={item.removeHref}
                aria-label={`Retirer le filtre ${item.label}`}
              >
                {item.label} <span aria-hidden="true">×</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
      <a className="text-link" href={resetHref}>
        Tout réinitialiser
      </a>
    </section>
  );
}
