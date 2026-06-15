"use client";

import { useEffect, useState, type ReactNode } from "react";

export interface ReaderStep {
  id: string;
  kind: string;
  title: string;
}

/**
 * Classroom-style reading workspace for a published module.
 *
 * Layout (full width): a progress rail (left), the reading column (centre) and a
 * reserved assistant column (right, rendered by the caller and gated by the AI
 * feature flag). The rail tracks the learner's position with an Intersection
 * Observer and exposes an accessible progress bar + step navigation.
 *
 * Visual progress is local UI state only; durable progress persistence is a
 * separate learner-experience increment (quiz attempts / completion).
 */
export function ReaderShell({
  steps,
  children,
  aside,
}: {
  steps: ReaderStep[];
  children: ReactNode;
  aside: ReactNode;
}) {
  const total = steps.length;
  const [active, setActive] = useState(0);
  const [tocOpen, setTocOpen] = useState(false);

  useEffect(() => {
    if (total === 0) return;
    const elements = steps
      .map((s) => document.getElementById(`step-${s.id}`))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const top = visible[0];
        if (!top) return;
        const id = top.target.id.replace("step-", "");
        const index = steps.findIndex((s) => s.id === id);
        if (index >= 0) setActive(index);
      },
      // Activate a step once it reaches the upper third of the viewport.
      { rootMargin: "-30% 0px -55% 0px", threshold: 0 },
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [steps, total]);

  const pct = total > 0 ? Math.round(((active + 1) / total) * 100) : 0;

  const jumpTo = (id: string) => {
    const el = document.getElementById(`step-${id}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    // Move focus to the step for keyboard and screen-reader users.
    window.setTimeout(() => el.focus({ preventScroll: true }), 350);
    setTocOpen(false);
  };

  return (
    <div className="reader">
      <div className="reader__rail">
        <nav className="reader-toc" aria-label="Progression du module">
          <p className="reader-progress__label">
            Étape <strong>{Math.min(active + 1, total)}</strong> sur {total}
          </p>
          <div
            className="reader-progress"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
            aria-label="Avancement dans le module"
          >
            <span className="reader-progress__fill" style={{ width: `${pct}%` }} />
          </div>

          <button
            type="button"
            className="reader-toc__toggle"
            aria-expanded={tocOpen}
            aria-controls="reader-steps"
            onClick={() => setTocOpen((v) => !v)}
          >
            Sommaire du module
          </button>

          <ol id="reader-steps" className={`reader-steps${tocOpen ? " is-open" : ""}`}>
            {steps.map((step, i) => {
              const state = i < active ? "done" : i === active ? "current" : "todo";
              return (
                <li key={step.id} className={`reader-step is-${state}`}>
                  <a
                    href={`#step-${step.id}`}
                    className="reader-step__link"
                    aria-current={state === "current" ? "step" : undefined}
                    onClick={(e) => {
                      e.preventDefault();
                      jumpTo(step.id);
                    }}
                  >
                    <span className="reader-step__marker" aria-hidden="true">
                      {state === "done" ? "✓" : i + 1}
                    </span>
                    <span className="reader-step__text">
                      <span className="reader-step__kind">{step.kind}</span>
                      <span className="reader-step__title">{step.title}</span>
                    </span>
                  </a>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>

      <div className="reader__main">{children}</div>

      <aside className="reader__aside" aria-label="Assistant pédagogique">
        {aside}
      </aside>
    </div>
  );
}
