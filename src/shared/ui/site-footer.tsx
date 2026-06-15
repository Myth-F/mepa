import Link from "next/link";

/** DSFR-style footer with the mandatory "non-official service" disclaimer. */
export function SiteFooter({ showTeamSpace }: { showTeamSpace: boolean }) {
  return (
    <footer role="contentinfo" className="footer">
      <div className="container footer__body">
        <p className="footer__service">MEPA</p>
        <p className="footer__desc">
          Plateforme pédagogique ouverte sur l’éthique de l’intelligence artificielle. Ce site
          s’inspire des principes d’ergonomie et d’accessibilité du Système de design de l’État,
          sans utiliser ses identités graphiques réservées.{" "}
          <strong>
            Il s’agit d’un service indépendant, qui n’est pas un service officiel de l’État.
          </strong>
        </p>
      </div>
      <div className="footer__bottom">
        <div className="container">
          <ul className="footer__links">
            <li>
              <Link href="/modules">Modules</Link>
            </li>
            <li>
              <Link href="/account/sign-in">Espace apprenant</Link>
            </li>
            {showTeamSpace && (
              <li>
                <Link href="/admin">Espace équipe</Link>
              </li>
            )}
          </ul>
          <p className="footer__mention">
            Accessibilité : démarche conforme aux critères inspirés du RGAA 4.1.
          </p>
        </div>
      </div>
    </footer>
  );
}
