"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CompletionControl({
  moduleVersionId,
  missingQuizCount,
  missingDilemmaCount,
  alreadyCompleted,
}: {
  moduleVersionId: string;
  missingQuizCount: number;
  missingDilemmaCount: number;
  alreadyCompleted: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState<string | null>(
    alreadyCompleted ? "Ce module est déjà enregistré dans votre progression." : null,
  );
  const missing = missingQuizCount + missingDilemmaCount;

  async function complete() {
    setPending(true);
    setError(null);
    const response = await fetch(`/api/learner/modules/${moduleVersionId}/complete`, {
      method: "POST",
    });
    const result = (await response.json()) as { error?: string; points?: number };
    setPending(false);
    if (!response.ok) {
      setError(result.error ?? "Le module ne peut pas encore être terminé.");
      return;
    }
    setSuccess(
      result.points
        ? `Module terminé. Vous gagnez ${result.points} points.`
        : "Module terminé et progression enregistrée.",
    );
    router.refresh();
  }

  return (
    <>
      {missing > 0 ? (
        <p id="completion-help" className="field__hint">
          Il reste {missingQuizCount > 0 ? `${missingQuizCount} quiz` : ""}
          {missingQuizCount > 0 && missingDilemmaCount > 0 ? " et " : ""}
          {missingDilemmaCount > 0
            ? `${missingDilemmaCount} dilemme${missingDilemmaCount > 1 ? "s" : ""}`
            : ""}{" "}
          à compléter.
        </p>
      ) : (
        <p id="completion-help" className="field__hint">
          Toutes les étapes obligatoires sont complétées.
        </p>
      )}
      {error && (
        <div className="alert alert--error" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="alert alert--success" role="status">
          {success}
        </div>
      )}
      <button
        className="btn"
        type="button"
        disabled={missing > 0 || pending || Boolean(success)}
        aria-describedby="completion-help"
        onClick={complete}
      >
        {success
          ? "Module terminé"
          : pending
            ? "Enregistrement…"
            : "Marquer le module comme terminé"}
      </button>
    </>
  );
}
