import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Breadcrumb } from "@/shared/ui/breadcrumb";
import { getCurrentStaff } from "@/shared/auth/staff-session";
import { signInStaffAction } from "./actions";

export const metadata: Metadata = { title: "Connexion équipe" };

const ERROR_MESSAGES: Record<string, string> = {
  missing: "Renseignez votre adresse e-mail et votre mot de passe.",
  invalid: "L’adresse e-mail ou le mot de passe ne correspond pas à un compte équipe actif.",
};

export default async function StaffSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await getCurrentStaff()) redirect("/admin");
  const { error } = await searchParams;
  const errorMessage = error ? ERROR_MESSAGES[error] : undefined;

  return (
    <div className="container page-narrow">
      <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Connexion équipe" }]} />
      <div className="page-heading">
        <p className="eyebrow">Accès réservé</p>
        <h1>Connexion de l’équipe pédagogique</h1>
        <p>
          Cet espace sert à préparer et publier les modules. Il est séparé des comptes utilisés pour
          suivre une progression.
        </p>
      </div>

      {errorMessage && (
        <div className="alert alert--error" role="alert" id="staff-signin-error">
          <strong>Connexion impossible</strong>
          <p>{errorMessage}</p>
        </div>
      )}

      <form className="form-panel" action={signInStaffAction}>
        <div className="field">
          <label htmlFor="staff-email">Adresse e-mail professionnelle</label>
          <input
            id="staff-email"
            name="email"
            type="email"
            autoComplete="username"
            required
            aria-invalid={errorMessage ? true : undefined}
            aria-describedby={errorMessage ? "staff-signin-error" : undefined}
          />
        </div>
        <div className="field">
          <label htmlFor="staff-password">Mot de passe</label>
          <input
            id="staff-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            aria-invalid={errorMessage ? true : undefined}
            aria-describedby={errorMessage ? "staff-signin-error" : undefined}
          />
        </div>
        <button className="btn" type="submit">
          Accéder à l’espace équipe
        </button>
      </form>
    </div>
  );
}
