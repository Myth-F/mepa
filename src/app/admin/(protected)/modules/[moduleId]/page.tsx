import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Route } from "next";
import { Breadcrumb } from "@/shared/ui/breadcrumb";
import { prisma } from "@/shared/db/prisma";
import { deleteDraftAction, saveDraftAction, startEditAction } from "../actions";
import { dilemmaOptionsToText, quizOptionsToText } from "../block-form";

export const dynamic = "force-dynamic";

const STATUS_MESSAGES: Record<string, string> = {
  created: "Brouillon créé. Vous pouvez ajouter les blocs du module.",
  saved: "Brouillon enregistré.",
  started: "Nouveau brouillon créé depuis la version publiée.",
  invalid: "Le brouillon contient des erreurs. Vérifiez les champs des blocs.",
  immutable: "Cette version est publiée et ne peut pas être modifiée.",
};

const LEVEL_LABELS: Record<string, string> = {
  BEGINNER: "Débutant",
  INTERMEDIATE: "Intermédiaire",
  ADVANCED: "Avancé",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}): Promise<Metadata> {
  const { moduleId } = await params;
  const mod = await prisma.module.findUnique({
    where: { id: moduleId },
    include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
  });
  return { title: mod?.versions[0]?.title ?? "Module" };
}

function stringValue(payload: unknown, key: string): string {
  const value = (payload as Record<string, unknown>)[key];
  return typeof value === "string" ? value : "";
}

function boolValue(payload: unknown, key: string): boolean {
  return (payload as Record<string, unknown>)[key] === true;
}

function BlockFields({
  index,
  block,
  order,
  enabled,
}: {
  index: number;
  block?: { type: string; payload: unknown };
  order: number;
  enabled: boolean;
}) {
  const type = block?.type ?? "rich_text";
  const payload = block?.payload ?? {};

  return (
    <fieldset className="block-editor">
      <legend>{block ? `Bloc ${order}` : "Ajouter un bloc"}</legend>
      <div className="field-grid">
        <label className="toggle-choice">
          <input type="checkbox" name={`block-${index}-enabled`} defaultChecked={enabled} />
          <span>{block ? "Conserver ce bloc" : "Créer ce bloc"}</span>
        </label>
        <div className="field">
          <label htmlFor={`block-${index}-order`}>Ordre</label>
          <input
            id={`block-${index}-order`}
            name={`block-${index}-order`}
            type="number"
            min="1"
            defaultValue={order}
            inputMode="numeric"
          />
        </div>
        <div className="field">
          <label htmlFor={`block-${index}-type`}>Type</label>
          <select id={`block-${index}-type`} name={`block-${index}-type`} defaultValue={type}>
            <option value="rich_text">Texte</option>
            <option value="quiz">Quiz</option>
            <option value="dilemma">Dilemme</option>
            <option value="image">Image</option>
          </select>
        </div>
      </div>

      <div className="block-editor__type" aria-label="Champs texte">
        <div className="field">
          <label htmlFor={`block-${index}-markdown`}>Texte</label>
          <textarea
            id={`block-${index}-markdown`}
            name={`block-${index}-markdown`}
            rows={6}
            defaultValue={type === "rich_text" ? stringValue(payload, "markdown") : ""}
          />
        </div>
      </div>

      <div className="block-editor__type" aria-label="Champs quiz">
        <div className="field">
          <label htmlFor={`block-${index}-question`}>Question du quiz</label>
          <input
            id={`block-${index}-question`}
            name={`block-${index}-question`}
            defaultValue={type === "quiz" ? stringValue(payload, "question") : ""}
          />
        </div>
        <div className="field">
          <label htmlFor={`block-${index}-options`}>Réponses</label>
          <p className="field__hint">
            Une réponse par ligne. Ajoutez un astérisque en fin de ligne pour marquer la bonne
            réponse.
          </p>
          <textarea
            id={`block-${index}-options`}
            name={`block-${index}-options`}
            rows={4}
            defaultValue={
              type === "quiz"
                ? quizOptionsToText(payload)
                : type === "dilemma"
                  ? dilemmaOptionsToText(payload)
                  : ""
            }
          />
        </div>
        <div className="field">
          <label htmlFor={`block-${index}-explanation`}>Explication</label>
          <textarea
            id={`block-${index}-explanation`}
            name={`block-${index}-explanation`}
            rows={3}
            defaultValue={type === "quiz" ? stringValue(payload, "explanation") : ""}
          />
        </div>
      </div>

      <div className="block-editor__type" aria-label="Champs dilemme">
        <div className="field">
          <label htmlFor={`block-${index}-prompt`}>Énoncé du dilemme</label>
          <textarea
            id={`block-${index}-prompt`}
            name={`block-${index}-prompt`}
            rows={4}
            defaultValue={type === "dilemma" ? stringValue(payload, "prompt") : ""}
          />
        </div>
      </div>

      <div className="block-editor__type" aria-label="Champs image">
        <div className="field">
          <label htmlFor={`block-${index}-mediaId`}>Identifiant média</label>
          <input
            id={`block-${index}-mediaId`}
            name={`block-${index}-mediaId`}
            defaultValue={type === "image" ? stringValue(payload, "mediaId") : ""}
          />
        </div>
        <div className="field">
          <label htmlFor={`block-${index}-alt`}>Texte alternatif</label>
          <input
            id={`block-${index}-alt`}
            name={`block-${index}-alt`}
            defaultValue={type === "image" ? stringValue(payload, "alt") : ""}
          />
        </div>
        <label className="toggle-choice">
          <input
            type="checkbox"
            name={`block-${index}-decorative`}
            defaultChecked={type === "image" ? boolValue(payload, "decorative") : false}
          />
          <span>Image décorative</span>
        </label>
        <div className="field">
          <label htmlFor={`block-${index}-caption`}>Légende</label>
          <input
            id={`block-${index}-caption`}
            name={`block-${index}-caption`}
            defaultValue={type === "image" ? stringValue(payload, "caption") : ""}
          />
        </div>
      </div>
    </fieldset>
  );
}

export default async function EditModulePage({
  params,
  searchParams,
}: {
  params: Promise<{ moduleId: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const [{ moduleId }, { status }, categories] = await Promise.all([
    params,
    searchParams,
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);
  const mod = await prisma.module.findUnique({
    where: { id: moduleId },
    include: {
      versions: {
        orderBy: { versionNumber: "desc" },
        include: {
          category: true,
          blocks: { orderBy: { position: "asc" } },
          sources: true,
        },
      },
    },
  });
  if (!mod) notFound();

  const draft = mod.versions.find((version) => version.status === "DRAFT");
  const published = mod.versions.find((version) => version.status === "PUBLISHED");
  const current = draft ?? published ?? mod.versions[0];
  const statusMessage = status ? STATUS_MESSAGES[status] : undefined;
  const blockSlotCount = (draft?.blocks.length ?? 0) + 1;

  return (
    <div className="container">
      <Breadcrumb
        items={[
          { label: "Accueil", href: "/" },
          { label: "Espace équipe", href: "/admin" },
          { label: "Modules", href: "/admin/modules" as Route },
          { label: current?.title ?? mod.slug },
        ]}
      />
      <div className="page-heading page-heading--split">
        <div>
          <p className="eyebrow">Édition</p>
          <h1>{current?.title ?? mod.slug}</h1>
          <p>Modifiez le brouillon, vérifiez le rendu, puis publiez une version immuable.</p>
        </div>
        <div className="admin-actions">
          <Link className="btn btn--secondary" href={`/admin/modules/${mod.id}/preview` as Route}>
            Prévisualiser
          </Link>
          <Link className="text-link" href={"/admin/modules" as Route}>
            Tous les modules
          </Link>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`alert ${status === "invalid" || status === "immutable" ? "alert--error" : "alert--success"}`}
          role="status"
        >
          <strong>
            {status === "invalid" || status === "immutable"
              ? "Action impossible"
              : "Action enregistrée"}
          </strong>
          <p>{statusMessage}</p>
        </div>
      )}

      {!draft ? (
        <section className="form-panel" aria-labelledby="start-edit-heading">
          <h2 id="start-edit-heading">Aucun brouillon actif</h2>
          <p>La version publiée reste visible pendant la préparation d’un nouveau brouillon.</p>
          <form action={startEditAction}>
            <input type="hidden" name="moduleId" value={mod.id} />
            <button className="btn" type="submit">
              Créer un brouillon depuis la version publiée
            </button>
          </form>
        </section>
      ) : (
        <form className="admin-editor" action={saveDraftAction}>
          <input type="hidden" name="moduleId" value={mod.id} />
          <input type="hidden" name="moduleVersionId" value={draft.id} />
          <input type="hidden" name="blockSlotCount" value={blockSlotCount} />

          <section className="form-panel" aria-labelledby="metadata-heading">
            <h2 id="metadata-heading">Informations du module</h2>
            <div className="field">
              <label htmlFor="title">Titre</label>
              <input id="title" name="title" defaultValue={draft.title} required />
            </div>
            <div className="field">
              <label htmlFor="summary">Résumé</label>
              <textarea id="summary" name="summary" rows={4} defaultValue={draft.summary} />
            </div>
            <div className="field">
              <label htmlFor="categoryId">Catégorie</label>
              <select id="categoryId" name="categoryId" defaultValue={draft.categoryId ?? ""}>
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
                <select id="level" name="level" defaultValue={draft.level ?? ""}>
                  <option value="">Non renseigné</option>
                  {Object.entries(LEVEL_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
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
                  defaultValue={draft.estimatedMinutes ?? ""}
                />
              </div>
              <div className="field">
                <label htmlFor="language">Langue</label>
                <input id="language" name="language" defaultValue={draft.language} />
              </div>
            </div>
            <div className="field">
              <label htmlFor="tags">Mots-clés</label>
              <input id="tags" name="tags" defaultValue={draft.tags.join(", ")} />
            </div>
            <label className="toggle-choice">
              <input type="checkbox" name="featured" defaultChecked={mod.featured} />
              <span>Mettre à la une</span>
            </label>
            <div className="field">
              <label htmlFor="featuredRank">Rang à la une</label>
              <input
                id="featuredRank"
                name="featuredRank"
                type="number"
                min="1"
                inputMode="numeric"
                defaultValue={mod.featuredRank ?? ""}
              />
            </div>
          </section>

          <section aria-labelledby="blocks-heading">
            <div className="section-heading">
              <p className="eyebrow">Blocs</p>
              <h2 id="blocks-heading">Composer le parcours</h2>
              <p>
                Modifiez les blocs existants, décochez un bloc pour le retirer, ou remplissez le
                bloc vide en bas de page pour en ajouter un.
              </p>
            </div>
            {draft.blocks.map((block, index) => (
              <BlockFields
                key={block.id}
                index={index}
                block={block}
                order={block.position + 1}
                enabled
              />
            ))}
            <BlockFields
              index={draft.blocks.length}
              order={draft.blocks.length + 1}
              enabled={false}
            />
          </section>

          <div className="admin-sticky-actions">
            <button className="btn" type="submit">
              Enregistrer le brouillon
            </button>
            <Link className="btn btn--secondary" href={`/admin/modules/${mod.id}/preview` as Route}>
              Prévisualiser
            </Link>
          </div>
        </form>
      )}

      {draft && (
        <form className="danger-zone" action={deleteDraftAction}>
          <h2>Supprimer le brouillon</h2>
          <p>La version publiée, si elle existe, reste disponible.</p>
          <input type="hidden" name="moduleId" value={mod.id} />
          <input type="hidden" name="moduleVersionId" value={draft.id} />
          <button className="btn btn--danger" type="submit">
            Supprimer le brouillon
          </button>
        </form>
      )}

      <section className="points-history" aria-labelledby="versions-heading">
        <h2 id="versions-heading">Historique des versions</h2>
        <ul>
          {mod.versions.map((version) => (
            <li key={version.id}>
              <div>
                <strong>
                  Version {version.versionNumber} · {version.status}
                </strong>
                <span>{version.title}</span>
              </div>
              {version.id === published?.id && (
                <span className="points-history__value">Publiée</span>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
