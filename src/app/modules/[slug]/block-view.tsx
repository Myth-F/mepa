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
}: {
  id: string;
  type: string;
  payload: unknown;
  slug: string;
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
        <figure className="media-placeholder">
          <p>[Image{parsed.data.decorative ? " décorative" : ` : ${parsed.data.alt}`}]</p>
          {parsed.data.caption && <figcaption>{parsed.data.caption}</figcaption>}
        </figure>
      );
    }
    case "quiz": {
      const parsed = quizPayloadSchema.safeParse(payload);
      if (!parsed.success) return null;
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
              <label className="choice" key={option.key}>
                <input type="checkbox" name="answer" value={option.key} />
                <span>{option.label}</span>
              </label>
            ))}
            <button className="btn btn--secondary" type="submit">
              Vérifier ma réponse
            </button>
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
