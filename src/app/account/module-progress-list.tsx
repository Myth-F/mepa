import Link from "next/link";
import type { LearnerModuleProgress } from "@/modules/learning/progress";

const STATUS_LABELS = {
  not_started: "Non commencé",
  in_progress: "En cours",
  completed: "Terminé",
} as const;

export function ModuleProgressList({ modules }: { modules: LearnerModuleProgress[] }) {
  if (!modules.some((module) => module.status !== "not_started")) {
    return (
      <div className="empty-state">
        <h2>Votre parcours commence ici</h2>
        <p>
          Choisissez un premier sujet. Vos étapes et vos résultats apparaîtront ensuite sur cette
          page.
        </p>
        <Link className="btn" href="/modules">
          Découvrir les modules
        </Link>
      </div>
    );
  }
  return (
    <section className="module-progress" aria-labelledby="module-progress-heading">
      <h2 id="module-progress-heading">Mes modules</h2>
      <ul>
        {modules.map((module) => (
          <li key={module.id}>
            <div>
              <span className={`status-badge status-badge--${module.status}`}>
                {STATUS_LABELS[module.status]}
              </span>
              <h3>
                <Link href={`/modules/${module.slug}`}>{module.title}</Link>
              </h3>
            </div>
            <p>
              {module.quizScore === null
                ? "Quiz non réalisé"
                : `Meilleur score : ${module.quizScore} %`}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
