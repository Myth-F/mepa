import Link from "next/link";
import { cookies } from "next/headers";
import { prisma } from "@/shared/db/prisma";
import { getCurrentLearner } from "@/shared/auth/learner-session";
import { getShowcase, getContinueModules, type ShowcaseItem } from "@/modules/discovery/showcase";
import { FIRST_VISIT_COOKIE } from "@/middleware";
import type { CourseLevel } from "@/generated/prisma";

const LEVEL_LABELS: Record<CourseLevel, string> = {
  BEGINNER: "Débutant",
  INTERMEDIATE: "Intermédiaire",
  ADVANCED: "Avancé",
};

function showcaseMeta(item: ShowcaseItem): string {
  return [
    item.categoryName ?? "Module",
    item.level ? LEVEL_LABELS[item.level] : null,
    item.estimatedMinutes ? `${item.estimatedMinutes} min` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

export default async function HomePage() {
  const [cookieStore, learner, showcase] = await Promise.all([
    cookies(),
    getCurrentLearner(),
    getShowcase(prisma, 6),
  ]);
  const firstVisit = !cookieStore.has(FIRST_VISIT_COOKIE);
  const continueItems = learner ? await getContinueModules(prisma, learner.id, 3) : [];

  return (
    <>
      <section className="hero">
        <div className="container">
          <div className="hero__inner">
            <div className="hero__content">
              <p className="eyebrow">
                {learner ? `Bon retour, ${learner.displayName}` : "Des repères pour décider"}
              </p>
              <h1 className="hero__title">
                {firstVisit && !learner
                  ? "L’intelligence artificielle vous concerne déjà."
                  : "Continuez à comprendre l’IA."}
              </h1>
              <p className="hero__lede">
                Comprenez simplement comment elle utilise vos données, influence des décisions et
                peut reproduire des inégalités.
              </p>
              <div className="hero__actions">
                <Link className="btn btn--lg" href="/modules">
                  {learner ? "Explorer les modules" : "Commencer un module"}
                </Link>
                {!learner && (
                  <Link className="text-link" href="/account/register">
                    Créer mon espace personnel
                  </Link>
                )}
              </div>
              {!learner && <p className="hero__reassurance">Aucun compte nécessaire pour commencer.</p>}
            </div>
            <aside className="hero__aside" aria-labelledby="first-session">
              <p className="hero__aside-kicker">Votre première session</p>
              <h2 id="first-session">10 minutes pour y voir plus clair</h2>
              <ul className="check-list">
                <li>Une situation concrète</li>
                <li>Des explications sans jargon</li>
                <li>Un quiz et des sources vérifiables</li>
              </ul>
            </aside>
          </div>
        </div>
      </section>

      {continueItems.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-heading">
              <p className="eyebrow">Reprendre</p>
              <h2 className="section__title">Là où vous vous êtes arrêté</h2>
            </div>
            <ul className="module-list" aria-label="Modules à reprendre">
              {continueItems.map((item) => (
                <li key={item.slug}>
                  <article className="module-card">
                    <div className="module-card__content">
                      <p className="module-card__meta">En cours</p>
                      <h3>
                        <Link href={`/modules/${item.slug}`}>{item.title}</Link>
                      </h3>
                    </div>
                    <Link className="module-card__link" href={`/modules/${item.slug}`}>
                      Reprendre <span aria-hidden="true">→</span>
                      <span className="sr-only"> le module « {item.title} »</span>
                    </Link>
                  </article>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {showcase.length > 0 && (
        <section className="section section--tint">
          <div className="container">
            <div className="section-heading">
              <p className="eyebrow">{learner ? "À découvrir" : "Quelques sujets pour commencer"}</p>
              <h2 className="section__title">Modules à la une</h2>
              <p>Choisissez un sujet qui vous parle. La lecture prend quelques minutes.</p>
            </div>
            <ul className="module-list" aria-label="Modules à la une">
              {showcase.map((item) => (
                <li key={item.slug}>
                  <article className="module-card">
                    <div className="module-card__content">
                      <p className="module-card__meta">{showcaseMeta(item)}</p>
                      <h3>
                        <Link href={`/modules/${item.slug}`}>{item.title}</Link>
                      </h3>
                      {item.summary && <p>{item.summary}</p>}
                    </div>
                    <Link className="module-card__link" href={`/modules/${item.slug}`}>
                      Découvrir <span aria-hidden="true">→</span>
                      <span className="sr-only"> le module « {item.title} »</span>
                    </Link>
                  </article>
                </li>
              ))}
            </ul>
            <p className="showcase__more">
              <Link className="text-link" href="/modules">
                Voir tous les modules et rechercher
              </Link>
            </p>
          </div>
        </section>
      )}

      <section className="section">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">Un parcours guidé</p>
            <h2 className="section__title">Comprendre avant de se faire une opinion</h2>
            <p>Chaque module suit le même chemin, pour que vous sachiez toujours où vous en êtes.</p>
          </div>
          <div className="journey">
            <article className="journey__step">
              <span aria-hidden="true">01</span>
              <h3>Partir du quotidien</h3>
              <p>Découvrez une situation réelle dans laquelle une IA intervient.</p>
            </article>
            <article className="journey__step">
              <span aria-hidden="true">02</span>
              <h3>Comprendre les enjeux</h3>
              <p>Avancez avec des explications courtes et des mots simples.</p>
            </article>
            <article className="journey__step">
              <span aria-hidden="true">03</span>
              <h3>Faire votre choix</h3>
              <p>Répondez à un dilemme, puis consultez les arguments et les sources.</p>
            </article>
          </div>
        </div>
      </section>

      {!learner && (
        <section className="section section--tint">
          <div className="container">
            <div className="account-invite">
              <div>
                <p className="eyebrow">À votre rythme</p>
                <h2>Vous souhaitez reprendre plus tard ?</h2>
                <p>
                  Votre espace personnel conserve votre progression. Votre adresse e-mail reste
                  privée.
                </p>
              </div>
              <div className="account-invite__actions">
                <Link className="btn btn--secondary" href="/account/register">
                  Créer mon espace
                </Link>
                <Link className="text-link" href="/account/sign-in">
                  J’ai déjà un compte
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
