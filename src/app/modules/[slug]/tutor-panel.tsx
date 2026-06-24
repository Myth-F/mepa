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
  const active = tutorIsAvailable();

  if (!active) return null;

  return (
    <div className="tutor">
      <div className="tutor__head">
        <p className="tutor__eyebrow">Assistant pédagogique</p>
        <span className="tutor__badge">Actif</span>
      </div>
    </div>
  );
}

export function tutorIsAvailable(): boolean {
  return isTutorEnabled(getConfiguredTutorProvider() !== null);
}
