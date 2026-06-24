"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";

interface NavItem {
  label: string;
  href: Route;
}

const PUBLIC_NAV_ITEMS: NavItem[] = [
  { label: "Accueil", href: "/" },
  { label: "Comprendre l’IA", href: "/modules" },
  { label: "Classement", href: "/leaderboard" },
];

/**
 * DSFR-style header / top bar. Provides access to the main areas of the system.
 * It deliberately omits restricted State identity assets (Marianne logo, "RF"
 * block): the brand is a neutral service block. The mobile menu toggles the
 * navigation with aria-expanded / aria-controls.
 */
export function SiteHeader({
  staff,
  learner,
}: {
  staff: { name: string } | null;
  learner: { displayName: string } | null;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const navItems: NavItem[] = staff
    ? [...PUBLIC_NAV_ITEMS, { label: "Espace équipe", href: "/admin" }]
    : learner
      ? [...PUBLIC_NAV_ITEMS, { label: "Mon espace", href: "/account/dashboard" }]
      : PUBLIC_NAV_ITEMS;

  return (
    <header role="banner" className="header">
      <div className="container">
        <div className="header__body">
          <Link className="header__brand" href="/">
            <span>
              <span className="header__service-title">MEPA</span>
              <span className="header__service-tagline">Comprendre l’IA et ses enjeux</span>
            </span>
          </Link>

          <div className="header__tools">
            {staff ? (
              <>
                <span className="header__staff-name">{staff.name}</span>
                <form action="/admin/sign-out" method="post">
                  <button className="quick-link" type="submit">
                    Se déconnecter
                  </button>
                </form>
              </>
            ) : learner ? (
              <>
                <Link className="quick-link" href="/account/dashboard">
                  {learner.displayName}
                </Link>
                <form action="/account/sign-out" method="post">
                  <button className="quick-link" type="submit">
                    Se déconnecter
                  </button>
                </form>
              </>
            ) : (
              <Link className="quick-link" href="/account/sign-in">
                Retrouver ma progression
              </Link>
            )}
            <button
              type="button"
              className="header__menu-toggle"
              aria-expanded={menuOpen}
              aria-controls="main-nav"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span className="header__burger" aria-hidden="true" />
              <span>Menu</span>
            </button>
          </div>
        </div>
      </div>

      <nav
        id="main-nav"
        role="navigation"
        aria-label="Menu principal"
        className={`nav${menuOpen ? " is-open" : ""}`}
      >
        <div className="container">
          <ul className="nav__list">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  className="nav__link"
                  href={item.href}
                  prefetch={false}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  );
}
