import type { Metadata } from "next";
import { Breadcrumb } from "@/shared/ui/breadcrumb";
import { requireLearner } from "@/shared/auth/learner-session";
import { prisma } from "@/shared/db/prisma";
import { ProfileSettingsForm } from "./profile-settings-form";

export const metadata: Metadata = { title: "Paramètres du profil" };

export default async function ProfileSettingsPage() {
  const learner = await requireLearner();
  const score = await prisma.learnerScore.findUnique({
    where: { learnerId: learner.id },
    select: { leaderboardOptIn: true },
  });
  return (
    <div className="container page-narrow">
      <Breadcrumb
        items={[
          { label: "Accueil", href: "/" },
          { label: "Mon espace", href: "/account/dashboard" },
          { label: "Paramètres" },
        ]}
      />
      <div className="page-heading">
        <p className="eyebrow">Profil et confidentialité</p>
        <h1>Mes paramètres</h1>
        <p>
          Choisissez le pseudonyme visible et décidez si vous souhaitez participer au classement.
        </p>
      </div>
      <ProfileSettingsForm
        displayName={learner.displayName}
        leaderboardOptIn={score?.leaderboardOptIn ?? false}
      />
    </div>
  );
}
