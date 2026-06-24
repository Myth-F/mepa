import Link from "next/link";

/** DSFR-style footer with the mandatory "non-official service" disclaimer. */
export function SiteFooter({
  showTeamSpace,
  learnerSignedIn,
}: {
  showTeamSpace: boolean;
  learnerSignedIn: boolean;
}) {
  return (
    <footer role="contentinfo" className="footer">
      <div className="container footer__body">
        <p className="footer__service">MEPA</p>
        <p className="footer__desc">
          Plateforme pédagogique ouverte pour comprendre l’éthique de l’intelligence artificielle.
        </p>
        <p className="footer__independence">Service indépendant, non officiel.</p>
      </div>
      <div className="footer__bottom">
        <div className="container footer__nav-grid">
          <nav aria-label="Liens utiles">
            <h2 className="footer__heading">Liens utiles</h2>
            <ul className="footer__links">
              <li>
                <Link href="/modules">Modules</Link>
              </li>
              <li>
                <Link href={learnerSignedIn ? "/account/dashboard" : "/account/sign-in"}>
                  Espace apprenant
                </Link>
              </li>
              {showTeamSpace && (
                <li>
                  <Link href="/admin">Espace équipe</Link>
                </li>
              )}
            </ul>
          </nav>
          <nav aria-label="Informations">
            <h2 className="footer__heading">Informations</h2>
            <ul className="footer__links">
              <li>
                <Link href="/accessibilite">Accessibilité : partiellement conforme</Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
