"use client";

function focusStep(id: string) {
  const element = document.getElementById(`step-${id}`);
  if (!element) return;
  element.scrollIntoView({ behavior: "smooth", block: "start" });
  window.setTimeout(() => element.focus({ preventScroll: true }), 0);
}

export function StepNavigation({
  previous,
  next,
}: {
  previous?: { id: string; label: string };
  next?: { id: string; label: string };
}) {
  return (
    <nav className="step-navigation" aria-label="Navigation entre les étapes">
      {previous ? (
        <button className="text-link" type="button" onClick={() => focusStep(previous.id)}>
          ← Étape précédente<span className="sr-only"> : {previous.label}</span>
        </button>
      ) : (
        <span />
      )}
      {next ? (
        <button className="text-link" type="button" onClick={() => focusStep(next.id)}>
          Étape suivante<span className="sr-only"> : {next.label}</span> →
        </button>
      ) : null}
    </nav>
  );
}
