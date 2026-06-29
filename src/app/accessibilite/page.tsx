import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/shared/ui/breadcrumb";

export const metadata: Metadata = {
  title: "Déclaration d’accessibilité",
  description: "État d’accessibilité d’Iavenir, périmètre audité et moyen de signaler un problème.",
  robots: { index: true, follow: true },
};

export default function AccessibilityStatementPage() {
  return (
    <div className="container reading-container accessibility-statement">
      <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Accessibilité" }]} />
      <header className="page-heading">
        <p className="eyebrow">Engagement d’inclusion</p>
        <h1>Déclaration d’accessibilité</h1>
        <p>
          Iavenir s’engage à rendre ses contenus utilisables par toutes et tous, quels que soient
          l’âge, l’équipement ou les technologies d’assistance employées.
        </p>
      </header>

      <nav className="statement-summary" aria-label="Sommaire de la déclaration">
        <strong>Dans cette déclaration</strong>
        <ul>
          <li>
            <a href="#conformite">État de conformité</a>
          </li>
          <li>
            <a href="#perimetre">Périmètre et méthode</a>
          </li>
          <li>
            <a href="#non-conformites">Limites connues</a>
          </li>
          <li>
            <a href="#contact">Signaler un problème</a>
          </li>
        </ul>
      </nav>

      <section id="conformite" aria-labelledby="conformite-heading">
        <h2 id="conformite-heading">État de conformité</h2>
        <p className="statement-status">
          <strong>Iavenir est partiellement conforme au RGAA 4.1.2.</strong>
        </p>
        <p>
          Le pré-audit de conception réalisé le <time dateTime="2026-06-10">10 juin 2026</time>
          estime à environ 97 % la conformité des critères applicables. Cette estimation repose sur
          le code et le DOM d’un build de production. Elle ne remplace pas un audit complet
          associant tests manuels et technologies d’assistance.
        </p>
      </section>

      <section id="perimetre" aria-labelledby="perimetre-heading">
        <h2 id="perimetre-heading">Périmètre et méthode</h2>
        <h3>Pages examinées</h3>
        <ul>
          <li>accueil et catalogue des modules ;</li>
          <li>lecteur d’un module et interactions pédagogiques ;</li>
          <li>connexion, inscription, tableau de bord et paramètres du profil ;</li>
          <li>classement public et espace de l’équipe pédagogique ;</li>
          <li>page d’erreur 404.</li>
        </ul>
        <h3>Technologies et outils</h3>
        <p>
          HTML5, CSS, TypeScript, React et Next.js ont été examinés dans Chromium. L’évaluation
          combine analyse du code et du DOM, navigation clavier, tests Playwright, tests Vitest et
          Lighthouse. Le détail est consigné dans le document d’audit du projet.
        </p>
      </section>

      <section id="non-conformites" aria-labelledby="non-conformites-heading">
        <h2 id="non-conformites-heading">Limites et non-conformités connues</h2>
        <ul>
          <li>
            la suppression complète du compte doit encore recevoir une confirmation renforcée ;
          </li>
          <li>
            les contrastes sur certains fonds teintés doivent être confirmés par mesure outillée ;
          </li>
          <li>
            le zoom à 200 %, le reflow à 320 px et l’espacement personnalisé restent à compléter
            manuellement ;
          </li>
          <li>une campagne avec NVDA, VoiceOver et TalkBack n’a pas encore été menée ;</li>
          <li>
            les alternatives des futurs médias devront être réévaluées lors de leur mise en ligne.
          </li>
        </ul>
      </section>

      <section id="contact" aria-labelledby="contact-heading">
        <h2 id="contact-heading">Signaler un problème d’accessibilité</h2>
        <p>
          Décrivez la page concernée, l’action impossible et, si vous le souhaitez, votre navigateur
          ou technologie d’assistance. N’incluez aucune donnée sensible.
        </p>
        <p>
          <a
            className="btn btn--secondary"
            href="https://github.com/Myth-F/mepa/issues/new"
            target="_blank"
            rel="noreferrer"
          >
            Ouvrir le formulaire de signalement
            <span className="sr-only"> (nouvel onglet)</span>
          </a>
        </p>
        <p>
          Si vous ne pouvez pas utiliser ce formulaire, demandez à une personne de l’équipe
          pédagogique de transmettre le signalement en indiquant l’URL et le contenu recherché.
        </p>
      </section>

      <p className="statement-updated">
        Déclaration établie le <time dateTime="2026-06-23">23 juin 2026</time>.{" "}
        <Link href="/">Retour à l’accueil</Link>.
      </p>
    </div>
  );
}
