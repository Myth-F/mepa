import Link from "next/link";
import type { Metadata } from "next";
import { Breadcrumb } from "@/shared/ui/breadcrumb";
import { registerLearnerAction } from "../actions";

export const metadata: Metadata = { title: "Créer mon espace personnel" };

const ERROR_MESSAGES: Record<string, string> = {
  duplicate: "Un espace existe déjà pour cette adresse e-mail. Connectez-vous pour le retrouver.",
  invalid:
    "Vérifiez les informations saisies. Le mot de passe doit contenir au moins 12 caractères.",
};

export default async function LearnerRegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const errorMessage = error ? ERROR_MESSAGES[error] : undefined;
  // Route the error to the field it concerns (11.10 / 11.11).
  const emailInvalid = error === "duplicate";
  const passwordInvalid = error === "invalid";

  return (
    <div className="container page-narrow">
      <Breadcrumb
        items={[
          { label: "Accueil", href: "/" },
          { label: "Espace personnel", href: "/account/sign-in" },
          { label: "Créer mon espace" },
        ]}
      />
      <div className="page-heading">
        <p className="eyebrow">Facultatif</p>
        <h1>Créer mon espace personnel</h1>
        <p>Enregistrez votre progression pour reprendre un module plus tard.</p>
      </div>
      <div className="notice">
        Votre adresse e-mail reste privée. Elle sert uniquement à accéder à votre progression.
      </div>
      {errorMessage && (
        <div className="alert alert--error" role="alert" id="register-error">
          <strong>Création impossible</strong>
          <p>{errorMessage}</p>
        </div>
      )}
      <form className="form-panel" action={registerLearnerAction}>
        <div className="field">
          <label htmlFor="displayName">Prénom ou pseudonyme</label>
          <p className="field__hint" id="display-name-hint">
            C’est le nom qui sera affiché dans votre espace.
          </p>
          <input
            id="displayName"
            name="displayName"
            type="text"
            autoComplete="nickname"
            aria-describedby="display-name-hint"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="email">Adresse e-mail</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-invalid={emailInvalid ? true : undefined}
            aria-describedby={emailInvalid ? "register-error" : undefined}
          />
        </div>
        <div className="field">
          <label htmlFor="password">Mot de passe</label>
          <p className="field__hint" id="password-hint">
            Utilisez au moins 12 caractères.
          </p>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={12}
            aria-describedby={passwordInvalid ? "password-hint register-error" : "password-hint"}
            aria-invalid={passwordInvalid ? true : undefined}
            required
          />
        </div>
        <button className="btn" type="submit">
          Créer mon espace
        </button>
      </form>
      <p>
        Vous avez déjà un compte ? <Link href="/account/sign-in">Retrouver ma progression</Link>
      </p>
    </div>
  );
}
