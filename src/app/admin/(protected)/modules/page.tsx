import Link from "next/link";
import type { Metadata } from "next";
import type { Route } from "next";
import { Breadcrumb } from "@/shared/ui/breadcrumb";
import { prisma } from "@/shared/db/prisma";

export const metadata: Metadata = { title: "Modules - Espace équipe" };
export const dynamic = "force-dynamic";

const LEVEL_LABELS: Record<string, string> = {
  BEGINNER: "Débutant",
  INTERMEDIATE: "Intermédiaire",
  ADVANCED: "Avancé",
};

export default async function AdminModulesPage() {
  const modules = await prisma.module.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      versions: {
        orderBy: { versionNumber: "desc" },
        take: 4,
        include: { category: true },
      },
    },
  });

  return (
    <div className="container">
      <Breadcrumb
        items={[
          { label: "Accueil", href: "/" },
          { label: "Espace équipe", href: "/admin" },
          { label: "Modules" },
        ]}
      />
      <div className="page-heading page-heading--split">
        <div>
          <p className="eyebrow">Autorat</p>
          <h1>Modules pédagogiques</h1>
          <p>Créez, préparez et publiez les contenus visibles dans le catalogue public.</p>
        </div>
        <Link className="btn" href={"/admin/modules/new" as Route}>
          Créer un module
        </Link>
      </div>

      {modules.length === 0 ? (
        <div className="empty-state">
          <h2>Aucun module pour le moment</h2>
          <p>Créez un premier brouillon pour alimenter le catalogue sans changer le code.</p>
          <Link className="text-link" href={"/admin/modules/new" as Route}>
            Créer le premier module
          </Link>
        </div>
      ) : (
        <div className="table-scroll">
          <table className="leaderboard-table admin-table">
            <caption>Modules existants et dernières versions</caption>
            <thead>
              <tr>
                <th scope="col">Module</th>
                <th scope="col">Statut courant</th>
                <th scope="col">Classification</th>
                <th scope="col">Curation</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {modules.map((mod) => {
                const draft = mod.versions.find((version) => version.status === "DRAFT");
                const published = mod.versions.find((version) => version.status === "PUBLISHED");
                const current = draft ?? published ?? mod.versions[0];
                return (
                  <tr key={mod.id}>
                    <th scope="row">
                      <span className="admin-table__title">{current?.title ?? mod.slug}</span>
                      <span className="admin-table__meta">{mod.slug}</span>
                    </th>
                    <td>
                      {draft ? (
                        <span className="status-badge status-badge--draft">Brouillon</span>
                      ) : published ? (
                        <span className="status-badge">Publié</span>
                      ) : (
                        <span className="status-badge status-badge--muted">Non publié</span>
                      )}
                      <span className="admin-table__meta">
                        {current ? `Version ${current.versionNumber}` : "Aucune version"}
                      </span>
                    </td>
                    <td>
                      <span>{current?.category?.name ?? "Sans catégorie"}</span>
                      <span className="admin-table__meta">
                        {current?.level
                          ? (LEVEL_LABELS[current.level] ?? current.level)
                          : "Niveau non renseigné"}
                      </span>
                    </td>
                    <td>{mod.featured ? `À la une #${mod.featuredRank ?? "-"}` : "Standard"}</td>
                    <td>
                      <Link className="text-link" href={`/admin/modules/${mod.id}` as Route}>
                        Ouvrir
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
