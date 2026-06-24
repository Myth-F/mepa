import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/shared/ui/breadcrumb";
import { validateResetToken } from "@/modules/identity/password-reset";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = { title: "Choisir un nouveau mot de passe" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token = "" } = await searchParams;
  const valid = await validateResetToken(token);
  return (
    <div className="container page-narrow">
      <Breadcrumb
        items={[
          { label: "Accueil", href: "/" },
          { label: "Connexion", href: "/account/sign-in" },
          { label: "Nouveau mot de passe" },
        ]}
      />
      <div className="page-heading">
        <p className="eyebrow">Sécuriser mon accès</p>
        <h1>Choisir un nouveau mot de passe</h1>
      </div>
      {valid ? (
        <ResetPasswordForm token={token} />
      ) : (
        <div className="alert alert--error" role="alert">
          <strong>Lien inutilisable</strong>
          <p>Ce lien est invalide, expiré ou a déjà servi.</p>
          <p>
            <Link href="/account/forgot-password">Demander un nouveau lien</Link>
          </p>
        </div>
      )}
    </div>
  );
}
