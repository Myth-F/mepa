import { isTutorEnabled, getConfiguredTutorProvider } from "@/modules/ai-boundary/flag";

/**
 * The reserved assistant column of the module reader.
 *
 * This is the *learner-facing surface* of the future AI tutor boundary. It is
 * gated by the feature flag AND the presence of a configured provider. The
 * default build ships no provider, so `active` is always false and this renders
 * an informational, NON-INTERACTIVE placeholder: there is no input field and no
 * request is ever issued. This keeps the default build compliant with the
 * future-ai-boundary spec ("no tutor UI or provider request is available").
 *
 * When a provider is configured and the flag is enabled (a later, security-
 * reviewed increment), the real chat client is mounted here instead.
 */
export function TutorPanel() {
  const active = isTutorEnabled(getConfiguredTutorProvider() !== null);

  return (
    <div className="tutor">
      <div className="tutor__head">
        <p className="tutor__eyebrow">Assistant pédagogique</p>
        <span className="tutor__badge">{active ? "Actif" : "Bientôt"}</span>
      </div>

      {active ? null : (
        <div className="tutor__body">
          <p>
            Un assistant pourra bientôt répondre à vos questions sur ce module. Il s’appuiera
            uniquement sur le contenu publié et les sources de ce module, sans rien inventer.
          </p>
          <p className="tutor__examples-label">Vous pourrez par exemple lui demander :</p>
          <ul className="tutor__examples">
            <li>« Peux-tu reformuler cette étape plus simplement ? »</li>
            <li>« Donne-moi un exemple concret du quotidien. »</li>
            <li>« Sur quelles sources repose cette affirmation ? »</li>
          </ul>
          <p className="tutor__note">
            <span className="tutor__dot" aria-hidden="true" />
            Fonctionnalité en préparation : elle n’est pas encore disponible.
          </p>
        </div>
      )}
    </div>
  );
}
