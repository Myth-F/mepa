import Link from "next/link";
import type { Metadata } from "next";
import { Breadcrumb } from "@/shared/ui/breadcrumb";
import { requireStaff } from "@/shared/auth/staff-session";

export const metadata: Metadata = { title: "Espace équipe pédagogique" };

export default async function AdminHomePage() {
  const staff = await requireStaff();

  return (
    <div className="container">
      <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Espace équipe" }]} />
      <div className="page-heading page-heading--split">
        <div>
          <p className="eyebrow">Espace réservé</p>
          <h1>Bonjour {staff.name}</h1>
          <p>Préparez des contenus clairs, vérifiez leur rendu puis publiez-les.</p>
        </div>
        <span className="status-badge">Session équipe active</span>
      </div>

      <section aria-labelledby="team-start">
        <h2 id="team-start">Que souhaitez-vous faire ?</h2>
        <div className="action-list">
          <article className="action-item">
            <div>
              <p className="action-item__step">1</p>
              <h3>Créer ou modifier un module</h3>
              <p>Assemblez des textes, quiz, dilemmes et sources dans l’ordre souhaité.</p>
            </div>
            <span className="text-link" aria-disabled="true">
              Constructeur bientôt disponible
            </span>
          </article>
          <article className="action-item">
            <div>
              <p className="action-item__step">2</p>
              <h3>Vérifier le parcours public</h3>
              <p>Consultez les modules déjà publiés comme les verra une personne apprenante.</p>
            </div>
            <Link className="text-link" href="/modules">
              Voir les modules publiés
            </Link>
          </article>
        </div>
      </section>
    </div>
  );
}
