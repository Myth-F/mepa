import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/shared/ui/site-header";
import { SiteFooter } from "@/shared/ui/site-footer";
import { getCurrentStaff } from "@/shared/auth/staff-session";
import { getCurrentLearner } from "@/shared/auth/learner-session";
import { env } from "@/shared/config/env";

export const metadata: Metadata = {
  metadataBase: new URL(env.APP_URL),
  title: {
    default: "MEPA — Éthique & pédagogie de l'IA",
    template: "%s — MEPA",
  },
  description:
    "Plateforme pédagogique ouverte sur l'éthique de l'intelligence artificielle. Service indépendant, non officiel.",
  alternates: { canonical: "/" },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [{ url: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" }],
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [staff, learner] = await Promise.all([getCurrentStaff(), getCurrentLearner()]);

  return (
    <html lang="fr">
      <body>
        <div className="skip-links">
          <div className="container">
            <a className="skip-link" href="#main">
              Aller au contenu principal
            </a>
          </div>
        </div>
        <SiteHeader staff={staff} learner={learner} />
        <main id="main" className="main">
          {children}
        </main>
        <SiteFooter showTeamSpace={Boolean(staff)} learnerSignedIn={Boolean(learner)} />
      </body>
    </html>
  );
}
