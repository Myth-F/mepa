import type { LearnerProgress } from "@/modules/learning/progress";

export function ProgressSummary({ progress }: { progress: LearnerProgress }) {
  return (
    <>
      <section className="score-hero" aria-labelledby="score-heading">
        <div>
          <p className="score-hero__label" id="score-heading">
            Niveau {progress.level}
          </p>
          <h2>{progress.levelLabel}</h2>
          <p>
            {progress.modulesCompleted} module{progress.modulesCompleted === 1 ? "" : "s"} terminé
            {progress.modulesCompleted === 1 ? "" : "s"}.
          </p>
        </div>
        <p className="score-hero__points">
          <strong>{progress.points}</strong> points
        </p>
      </section>
      <dl className="progress-summary">
        <div>
          <dt>Modules commencés</dt>
          <dd>{progress.modulesStarted}</dd>
        </div>
        <div>
          <dt>Modules terminés</dt>
          <dd>{progress.modulesCompleted}</dd>
        </div>
        {progress.leaderboardOptIn && (
          <div>
            <dt>Rang au classement</dt>
            <dd>{progress.rank ? `#${progress.rank}` : "—"}</dd>
          </div>
        )}
      </dl>
    </>
  );
}
