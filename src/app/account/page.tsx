import Link from "next/link";
import type { Metadata } from "next";
import { Breadcrumb } from "@/shared/ui/breadcrumb";
import { requireLearner } from "@/shared/auth/learner-session";
import { prisma } from "@/shared/db/prisma";
import { labelForLevel, nextLevelThreshold, POINT_RULES } from "@/modules/gamification/rules";
import { deleteLearnerAction, updateLeaderboardParticipationAction } from "./actions";

export const metadata: Metadata = { title: "Mon espace personnel" };

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ ranking?: string }>;
}) {
  const learner = await requireLearner();
  const { ranking } = await searchParams;
  const [completed, attempts, score, events] = await Promise.all([
    prisma.moduleCompletion.count({ where: { learnerId: learner.id } }),
    prisma.quizAttempt.count({ where: { learnerId: learner.id } }),
    prisma.learnerScore.findUnique({ where: { learnerId: learner.id } }),
    prisma.pointEvent.findMany({
      where: { learnerId: learner.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { moduleVersion: { select: { title: true } } },
    }),
  ]);
  const totalPoints = score?.totalPoints ?? 0;
  const level = score?.level ?? 1;
  const nextThreshold = nextLevelThreshold(totalPoints);

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

      <section className="score-hero" aria-labelledby="score-heading">
        <div>
          <p className="score-hero__label" id="score-heading">
            Niveau {level}
          </p>
          <h2>{labelForLevel(level)}</h2>
          <p>{nextThreshold - totalPoints} points avant le niveau suivant.</p>
        </div>
        <p className="score-hero__points">
          <strong>{totalPoints}</strong> points
        </p>
      </section>

      <dl className="progress-summary">
        <div>
          <dt>Modules terminés</dt>
          <dd>{completed}</dd>
        </div>
        <div>
          <dt>Quiz réalisés</dt>
          <dd>{attempts}</dd>
        </div>
      </dl>

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
              defaultChecked={score?.leaderboardOptIn ?? false}
            />
            <span>Afficher mon pseudonyme dans le classement</span>
          </label>
          <button className="btn btn--secondary" type="submit">
            Enregistrer mon choix
          </button>
        </form>
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
          <button className="btn btn--danger" type="submit">
            Supprimer mon espace
          </button>
        </form>
      </section>
    </div>
  );
}
