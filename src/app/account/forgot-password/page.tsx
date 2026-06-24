import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/shared/ui/breadcrumb";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = { title: "Mot de passe oublié" };

export default function ForgotPasswordPage() {
  return (
    <div className="container page-narrow">
      <Breadcrumb
        items={[
          { label: "Accueil", href: "/" },
          { label: "Connexion", href: "/account/sign-in" },
          { label: "Mot de passe oublié" },
        ]}
      />
      <div className="page-heading">
        <p className="eyebrow">Récupérer mon accès</p>
        <h1>Mot de passe oublié</h1>
        <p>Indiquez l’adresse utilisée pour votre espace. Le lien reçu sera valable 15 minutes.</p>
      </div>
      <ForgotPasswordForm />
      <p>
        <Link href="/account/sign-in">Revenir à la connexion</Link>
      </p>
    </div>
  );
}
