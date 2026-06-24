import Link from "next/link";
import type { Metadata } from "next";
import { Breadcrumb } from "@/shared/ui/breadcrumb";
import { signInLearnerAction } from "../actions";
import { PasswordField } from "../password-field";
import { getCurrentLearner } from "@/shared/auth/learner-session";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Retrouver ma progression" };

const ERROR_MESSAGES: Record<string, string> = {
  missing: "Renseignez votre adresse e-mail et votre mot de passe.",
  invalid: "L’adresse e-mail ou le mot de passe est incorrect.",
};

export default async function LearnerSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await getCurrentLearner()) redirect("/account/dashboard");
  const { error } = await searchParams;
  const errorMessage = error ? ERROR_MESSAGES[error] : undefined;

  return (
    <div className="container page-narrow">
      <Breadcrumb
        items={[
          { label: "Accueil", href: "/" },
          { label: "Espace personnel", href: "/account/sign-in" },
          { label: "Connexion" },
        ]}
      />
      <div className="page-heading">
        <p className="eyebrow">Votre espace personnel</p>
        <h1>Retrouver ma progression</h1>
        <p id="signin-help">Connectez-vous pour reprendre là où vous vous êtes arrêté.</p>
      </div>
      {errorMessage && (
        <div className="alert alert--error" role="alert" id="signin-error">
          <strong>Connexion impossible</strong>
          <p>{errorMessage}</p>
        </div>
      )}
      <form className="form-panel" action={signInLearnerAction} aria-describedby="signin-help">
        <div className="field">
          <label htmlFor="email">Adresse e-mail</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-invalid={errorMessage ? true : undefined}
            aria-describedby={errorMessage ? "signin-error" : undefined}
          />
        </div>
        <PasswordField
          id="password"
          autoComplete="current-password"
          invalid={Boolean(errorMessage)}
          describedBy={errorMessage ? "signin-error" : undefined}
        />
        <p>
          <Link href="/account/forgot-password">Mot de passe oublié ?</Link>
        </p>
        <button className="btn" type="submit">
          Retrouver ma progression
        </button>
      </form>
      <p>
        Première visite ? <Link href="/account/register">Créer mon espace personnel</Link>
      </p>
    </div>
  );
}
