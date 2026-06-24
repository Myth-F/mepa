import Link from "next/link";
import type { LearnerModuleProgress } from "@/modules/learning/progress";

export function NextStepRecommendation({ modules }: { modules: LearnerModuleProgress[] }) {
  const next =
    modules.find((module) => module.status === "in_progress") ??
    modules.find((module) => module.status === "not_started");
  if (!next)
    return (
      <div className="notice">
        <strong>Parcours à jour</strong>
        <p>
          Vous avez terminé tous les modules publiés. Revenez bientôt pour découvrir de nouveaux
          sujets.
        </p>
      </div>
    );
  return (
    <section className="next-step" aria-labelledby="next-step-heading">
      <div>
        <p className="eyebrow">Prochaine étape</p>
        <h2 id="next-step-heading">
          {next.status === "in_progress" ? "Reprendre" : "Découvrir"} « {next.title} »
        </h2>
        <p>
          {next.status === "in_progress"
            ? "Poursuivez là où vous vous êtes arrêté."
            : "Ce module est le prochain sujet disponible dans votre parcours."}
        </p>
      </div>
      <Link className="btn btn--secondary" href={`/modules/${next.slug}`}>
        {next.status === "in_progress" ? "Reprendre" : "Commencer"}
      </Link>
    </section>
  );
}
