import Link from "next/link";
import type { Metadata } from "next";
import { Breadcrumb } from "@/shared/ui/breadcrumb";
import { requireLearner } from "@/shared/auth/learner-session";
import { prisma } from "@/shared/db/prisma";
import { POINT_RULES } from "@/modules/gamification/rules";
import { getLearnerProgress } from "@/modules/learning/progress";
import { deleteLearnerAction, updateLeaderboardParticipationAction } from "./actions";
import { ProgressSummary } from "./progress-summary";
import { ModuleProgressList } from "./module-progress-list";
import { NextStepRecommendation } from "./next-step-recommendation";
import { DeleteProgressButton } from "./delete-progress-button";
import { DeleteAccountButton } from "./delete-account-button";

export const metadata: Metadata = { title: "Mon espace personnel" };

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ ranking?: string }>;
}) {
  const learner = await requireLearner();
  const { ranking } = await searchParams;
  const [progress, events] = await Promise.all([
    getLearnerProgress(prisma, learner.id),
    prisma.pointEvent.findMany({
      where: { learnerId: learner.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { moduleVersion: { select: { title: true } } },
    }),
  ]);
  const sessionMinutes = learner.sessionAgeMinutes;

  return (
    <div className="container page-narrow">
      <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Mon espace personnel" }]} />
      {ranking && (
        <div className="alert alert--success" role="status">
          {ranking === "joined"
            ? "Vous apparaissez maintenant dans le classement avec votre pseudonyme."
            : "Vous n’apparaissez plus dans le classement."}
        </div>
      )}
      <div className="page-heading">
        <p className="eyebrow">Votre progression</p>
        <h1>Bonjour {learner.displayName}</h1>
        <p>Retrouvez vos apprentissages et comprenez comment vos points ont été gagnés.</p>
      </div>

      <div className="session-info">
        <span>
          Session active depuis{" "}
          {sessionMinutes < 1 ? "moins d’une minute" : `${sessionMinutes} min`}
        </span>
        <form action="/account/sign-out" method="post">
          <button className="text-link" type="submit">
            Se déconnecter
          </button>
        </form>
      </div>
      <ProgressSummary progress={progress} />
      <NextStepRecommendation modules={progress.modules} />
      <ModuleProgressList modules={progress.modules} />

      <section className="ranking-choice" aria-labelledby="ranking-choice-heading">
        <div>
          <h2 id="ranking-choice-heading">Classement facultatif</h2>
          <p>
            Seul votre pseudonyme, votre niveau et vos points sont visibles. Votre adresse e-mail
            reste privée.
          </p>
          <Link href="/leaderboard" prefetch={false}>
            Consulter le classement
          </Link>
        </div>
        <form action={updateLeaderboardParticipationAction}>
          <label className="toggle-choice">
            <input
              type="checkbox"
              name="leaderboardOptIn"
              defaultChecked={progress.leaderboardOptIn}
            />
            <span>Afficher mon pseudonyme dans le classement</span>
          </label>
          <button className="btn btn--secondary" type="submit">
            Enregistrer mon choix
          </button>
        </form>
      </section>

      <section className="data-controls" aria-labelledby="data-controls-heading">
        <h2 id="data-controls-heading">Mes données de progression</h2>
        <p>
          Iavenir conserve les modules commencés ou terminés, vos réponses aux quiz, vos choix
          pédagogiques et les points associés. Votre adresse e-mail n’est jamais affichée
          publiquement.
        </p>
        <div className="admin-actions">
          <a className="btn btn--secondary" href="/api/learner/progress/export">
            Exporter ma progression
          </a>
          <DeleteProgressButton />
          <Link className="text-link" href="/account/settings">
            Modifier mon pseudonyme et ma confidentialité
          </Link>
        </div>
      </section>

      <section className="points-history" aria-labelledby="points-history-heading">
        <h2 id="points-history-heading">Comment ai-je gagné mes points ?</h2>
        {events.length === 0 ? (
          <p className="notice">
            Terminez un module, réussissez un quiz ou participez à un dilemme pour gagner vos
            premiers points.
          </p>
        ) : (
          <ul>
            {events.map((event) => (
              <li key={event.id}>
                <div>
                  <strong>{POINT_RULES[event.kind].label}</strong>
                  <span>{event.moduleVersion.title}</span>
                </div>
                <span className="points-history__value">+{event.points} points</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link className="btn" href="/modules">
        Continuer à apprendre
      </Link>
      <section className="danger-zone" aria-labelledby="delete-account">
        <h2 id="delete-account">Supprimer mon espace</h2>
        <p>Cette action supprime définitivement votre compte, vos points et votre progression.</p>
        <form action={deleteLearnerAction}>
          <DeleteAccountButton />
        </form>
      </section>
    </div>
  );
}
