import type { BlockType } from "@/modules/authoring/blocks/registry";
import {
  richTextPayloadSchema,
  quizPayloadSchema,
  dilemmaPayloadSchema,
  imagePayloadSchema,
} from "@/modules/authoring/blocks/schemas";
import { submitDilemmaAction, submitQuizAction } from "./actions";

export function BlockView({
  id,
  type,
  payload,
  slug,
  quizResult,
  selectedAnswers = [],
}: {
  id: string;
  type: string;
  payload: unknown;
  slug: string;
  quizResult?: string;
  selectedAnswers?: string[];
}) {
  switch (type as BlockType) {
    case "rich_text": {
      const parsed = richTextPayloadSchema.safeParse(payload);
      if (!parsed.success) return null;
      return (
        <div className="prose">
          {parsed.data.markdown.split(/\n{2,}/).map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      );
    }
    case "image": {
      const parsed = imagePayloadSchema.safeParse(payload);
      if (!parsed.success) return null;
      return (
        <figure className="module-media">
          {/* Dimensions are unknown for uploaded authoring media; the browser
              preserves intrinsic dimensions while CSS constrains the width. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/media/${encodeURIComponent(parsed.data.mediaId)}`}
            alt={parsed.data.decorative ? "" : parsed.data.alt}
          />
          {parsed.data.caption && <figcaption>{parsed.data.caption}</figcaption>}
        </figure>
      );
    }
    case "quiz": {
      const parsed = quizPayloadSchema.safeParse(payload);
      if (!parsed.success) return null;
      const showResult = quizResult === "quiz-passed" || quizResult === "quiz-failed";
      return (
        <form action={submitQuizAction}>
          <input type="hidden" name="blockId" value={id} />
          <input type="hidden" name="slug" value={slug} />
          <fieldset className="question-panel">
            <legend>{parsed.data.question}</legend>
            <p className="question-panel__help">
              Sélectionnez la ou les réponses qui vous semblent justes.
            </p>
            {parsed.data.options.map((option) => (
              <label
                className={`choice${showResult && option.correct ? " choice--correct" : ""}${showResult && selectedAnswers.includes(option.key) && !option.correct ? " choice--incorrect" : ""}`}
                key={option.key}
              >
                <input
                  type="checkbox"
                  name="answer"
                  value={option.key}
                  defaultChecked={selectedAnswers.includes(option.key)}
                  disabled={showResult}
                />
                <span>
                  {option.label}
                  {showResult && option.correct && (
                    <strong className="choice__result">Bonne réponse</strong>
                  )}
                </span>
              </label>
            ))}
            <button className="btn btn--secondary" type="submit" disabled={showResult}>
              {showResult ? "Réponse vérifiée" : "Vérifier ma réponse"}
            </button>
            {showResult && parsed.data.explanation && (
              <div className="quiz-explanation" role="status" aria-live="polite">
                <h3>Pourquoi ?</h3>
                <p>{parsed.data.explanation}</p>
                {parsed.data.explanationSource && (
                  <p>
                    <a href={parsed.data.explanationSource.url} target="_blank" rel="noreferrer">
                      Consulter la source : {parsed.data.explanationSource.title}
                      <span className="sr-only"> (nouvel onglet)</span>
                    </a>
                  </p>
                )}
              </div>
            )}
          </fieldset>
        </form>
      );
    }
    case "dilemma": {
      const parsed = dilemmaPayloadSchema.safeParse(payload);
      if (!parsed.success) return null;
      return (
        <form action={submitDilemmaAction}>
          <input type="hidden" name="blockId" value={id} />
          <input type="hidden" name="slug" value={slug} />
          <fieldset className="question-panel question-panel--dilemma">
            <legend>{parsed.data.prompt}</legend>
            <p className="question-panel__help">
              Il n’y a pas de mauvaise réponse. Choisissez celle qui vous correspond.
            </p>
            {parsed.data.options.map((option) => (
              <label className="choice" key={option.key}>
                <input type="radio" name="choice" value={option.key} required />
                <span>{option.label}</span>
              </label>
            ))}
            <button className="btn btn--secondary" type="submit">
              Valider mon choix
            </button>
          </fieldset>
        </form>
      );
    }
    default:
      return null;
  }
}
