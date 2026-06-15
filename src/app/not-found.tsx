import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container page-narrow not-found">
      <p className="eyebrow">Erreur 404</p>
      <h1>Cette page n’est pas disponible</h1>
      <p>Le lien est peut-être ancien ou l’adresse contient une erreur.</p>
      <div className="hero__actions">
        <Link className="btn" href="/modules">
          Voir les modules
        </Link>
        <Link className="text-link" href="/">
          Revenir à l’accueil
        </Link>
      </div>
    </div>
  );
}
