"use client";

import { useId, useState } from "react";
import Link from "next/link";
import type { Route } from "next";

export interface BreadcrumbItem {
  label: string;
  /** Omit href for the current page (rendered with aria-current="page"). */
  href?: Route;
}

/**
 * DSFR-style breadcrumb (fil d'Ariane). Follows the DSFR accessibility pattern:
 * a <nav aria-label="Vous êtes ici :"> with an ordered list, the last item
 * marked aria-current="page", and a mobile "Voir le fil d'Ariane" button that
 * toggles the list (aria-expanded / aria-controls). No icon assets are used:
 * separators are drawn in CSS.
 */
export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  const [open, setOpen] = useState(false);
  const listId = useId();

  return (
    <nav role="navigation" aria-label="Vous êtes ici :" className="breadcrumb">
      <button
        type="button"
        className="breadcrumb__button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
      >
        Voir le fil d’Ariane
      </button>
      <div id={listId} className={`breadcrumb__collapse${open ? " is-open" : ""}`}>
        <ol className="breadcrumb__list">
          {items.map((item, i) => {
            const isLast = i === items.length - 1;
            return (
              <li key={`${item.label}-${i}`}>
                {item.href && !isLast ? (
                  <Link className="breadcrumb__link" href={item.href}>
                    {item.label}
                  </Link>
                ) : (
                  <a className="breadcrumb__link" aria-current="page">
                    {item.label}
                  </a>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
