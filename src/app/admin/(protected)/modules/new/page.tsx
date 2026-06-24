import Link from "next/link";
import type { Metadata } from "next";
import type { Route } from "next";
import { Breadcrumb } from "@/shared/ui/breadcrumb";
import { prisma } from "@/shared/db/prisma";
import { createModuleAction } from "../actions";

export const metadata: Metadata = { title: "Créer un module - Espace équipe" };

const ERROR_MESSAGES: Record<string, string> = {
  "missing-title": "Le titre est obligatoire.",
  "invalid-slug": "Le slug doit contenir au moins une lettre ou un chiffre.",
  "duplicate-slug": "Ce slug existe déjà. Choisissez une adresse différente.",
};

export default async function NewModulePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ error }, categories] = await Promise.all([
    searchParams,
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);
  const errorMessage = error ? ERROR_MESSAGES[error] : undefined;

  return (
    <div className="container page-narrow">
      <Breadcrumb
        items={[
          { label: "Accueil", href: "/" },
          { label: "Espace équipe", href: "/admin" },
          { label: "Modules", href: "/admin/modules" as Route },
          { label: "Créer" },
        ]}
      />
      <div className="page-heading">
        <p className="eyebrow">Nouveau brouillon</p>
        <h1>Créer un module</h1>
        <p>Renseignez les informations de base. Les blocs seront ajoutés à l’étape suivante.</p>
      </div>

      {errorMessage && (
        <div className="alert alert--error" role="alert">
          <strong>Création impossible</strong>
          <p>{errorMessage}</p>
        </div>
      )}

      <form className="form-panel" action={createModuleAction}>
        <div className="field">
          <label htmlFor="title">Titre du module</label>
          <input id="title" name="title" required />
        </div>
        <div className="field">
          <label htmlFor="slug">Adresse courte</label>
          <p className="field__hint">
            Optionnel. Si le champ est vide, elle sera générée depuis le titre.
          </p>
          <input id="slug" name="slug" pattern="[a-z0-9\\-]+" />
        </div>
        <div className="field">
          <label htmlFor="summary">Résumé</label>
          <textarea id="summary" name="summary" rows={4} />
        </div>
        <div className="field">
          <label htmlFor="publishedAt">Date de publication</label>
          <p className="field__hint">Optionnel. La date du jour sera utilisée par défaut.</p>
          <input id="publishedAt" name="publishedAt" type="date" />
        </div>
        <div className="field">
          <label htmlFor="categoryId">Catégorie</label>
          <select id="categoryId" name="categoryId" defaultValue="">
            <option value="">Sans catégorie</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field-grid">
          <div className="field">
            <label htmlFor="level">Niveau</label>
            <select id="level" name="level" defaultValue="">
              <option value="">Non renseigné</option>
              <option value="BEGINNER">Débutant</option>
              <option value="INTERMEDIATE">Intermédiaire</option>
              <option value="ADVANCED">Avancé</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="estimatedMinutes">Durée estimée</label>
            <input
              id="estimatedMinutes"
              name="estimatedMinutes"
              type="number"
              min="1"
              inputMode="numeric"
            />
          </div>
          <div className="field">
            <label htmlFor="language">Langue</label>
            <input id="language" name="language" defaultValue="fr" />
          </div>
        </div>
        <div className="field">
          <label htmlFor="tags">Mots-clés</label>
          <p className="field__hint">Séparez les mots-clés par des virgules.</p>
          <input id="tags" name="tags" />
        </div>
        <label className="toggle-choice">
          <input type="checkbox" name="featured" />
          <span>Mettre ce module à la une après publication</span>
        </label>
        <div className="field">
          <label htmlFor="featuredRank">Rang à la une</label>
          <input id="featuredRank" name="featuredRank" type="number" min="1" inputMode="numeric" />
        </div>
        <div className="admin-actions">
          <button className="btn" type="submit">
            Créer le brouillon
          </button>
          <Link className="text-link" href={"/admin/modules" as Route}>
            Annuler
          </Link>
        </div>
      </form>
    </div>
  );
}
