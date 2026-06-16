import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Route } from "next";
import { Breadcrumb } from "@/shared/ui/breadcrumb";
import { prisma } from "@/shared/db/prisma";
import { ModuleService } from "@/modules/authoring/module-service";
import {
  dilemmaPayloadSchema,
  imagePayloadSchema,
  quizPayloadSchema,
  richTextPayloadSchema,
} from "@/modules/authoring/blocks/schemas";
import { publishDraftAction } from "../../actions";

export const dynamic = "force-dynamic";

const STATUS_MESSAGES: Record<string, string> = {
  published: "La version a été publiée et le catalogue public a été mis à jour.",
  invalid: "La publication est bloquée par les erreurs de validation ci-dessous.",
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
  return { title: `Prévisualisation - ${mod?.versions[0]?.title ?? "Module"}` };
}

function PreviewBlock({ type, payload }: { type: string; payload: unknown }) {
  if (type === "rich_text") {
    const parsed = richTextPayloadSchema.safeParse(payload);
    if (!parsed.success) return null;
    return (
      <div className="prose">
        {parsed.data.markdown.split(/\n{2,}/).map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    );
  }
  if (type === "quiz") {
    const parsed = quizPayloadSchema.safeParse(payload);
    if (!parsed.success) return null;
    return (
      <div className="question-panel" role="group" aria-label="Prévisualisation du quiz">
        <p className="module-step__number">Quiz</p>
        <h3>{parsed.data.question}</h3>
        <ul>
          {parsed.data.options.map((option) => (
            <li key={option.key}>
              {option.label}
              {option.correct ? " (réponse correcte)" : ""}
            </li>
          ))}
        </ul>
        {parsed.data.explanation && <p>{parsed.data.explanation}</p>}
      </div>
    );
  }
  if (type === "dilemma") {
    const parsed = dilemmaPayloadSchema.safeParse(payload);
    if (!parsed.success) return null;
    return (
      <div
        className="question-panel question-panel--dilemma"
        role="group"
        aria-label="Prévisualisation du dilemme"
      >
        <p className="module-step__number">Dilemme</p>
        <h3>{parsed.data.prompt}</h3>
        <ul>
          {parsed.data.options.map((option) => (
            <li key={option.key}>{option.label}</li>
          ))}
        </ul>
      </div>
    );
  }
  if (type === "image") {
    const parsed = imagePayloadSchema.safeParse(payload);
    if (!parsed.success) return null;
    return (
      <figure className="media-placeholder">
        <p>[Image{parsed.data.decorative ? " décorative" : ` : ${parsed.data.alt}`}]</p>
        {parsed.data.caption && <figcaption>{parsed.data.caption}</figcaption>}
      </figure>
    );
  }
  return null;
}

export default async function ModulePreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ moduleId: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const [{ moduleId }, { status }] = await Promise.all([params, searchParams]);
  const mod = await prisma.module.findUnique({
    where: { id: moduleId },
    include: {
      versions: {
        orderBy: { versionNumber: "desc" },
        include: {
          blocks: { orderBy: { position: "asc" } },
          sources: true,
          category: true,
        },
      },
    },
  });
  if (!mod) notFound();

  const draft = mod.versions.find((version) => version.status === "DRAFT");
  const published = mod.versions.find((version) => version.status === "PUBLISHED");
  const version = draft ?? published ?? mod.versions[0];
  if (!version) notFound();

  const validationErrors = draft ? await new ModuleService(prisma).validateDraft(draft.id) : [];
  const statusMessage = status ? STATUS_MESSAGES[status] : undefined;

  return (
    <div className="container reading-container">
      <Breadcrumb
        items={[
          { label: "Accueil", href: "/" },
          { label: "Espace équipe", href: "/admin" },
          { label: "Modules", href: "/admin/modules" as Route },
          { label: version.title, href: `/admin/modules/${mod.id}` as Route },
          { label: "Prévisualisation" },
        ]}
      />
      <div className="page-heading">
        <p className="eyebrow">Prévisualisation</p>
        <h1>{version.title}</h1>
        {version.summary && <p>{version.summary}</p>}
      </div>

      {statusMessage && (
        <div
          className={`alert ${status === "invalid" ? "alert--error" : "alert--success"}`}
          role="status"
        >
          <strong>
            {status === "invalid" ? "Publication impossible" : "Publication effectuée"}
          </strong>
          <p>{statusMessage}</p>
        </div>
      )}

      {validationErrors.length > 0 && (
        <div className="alert alert--error" role="alert">
          <strong>Corrections nécessaires avant publication</strong>
          <ul>
            {validationErrors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="admin-actions">
        <Link className="btn btn--secondary" href={`/admin/modules/${mod.id}` as Route}>
          Modifier
        </Link>
        {draft && (
          <form action={publishDraftAction}>
            <input type="hidden" name="moduleId" value={mod.id} />
            <input type="hidden" name="moduleVersionId" value={draft.id} />
            <button className="btn" type="submit" disabled={validationErrors.length > 0}>
              Publier cette version
            </button>
          </form>
        )}
        {published && (
          <Link className="text-link" href={`/modules/${mod.slug}`}>
            Voir la version publique
          </Link>
        )}
      </div>

      <ol className="module-steps">
        {version.blocks.map((block, index) => (
          <li key={block.id} className="module-step">
            <p className="module-step__number">
              Étape {index + 1} sur {version.blocks.length}
            </p>
            <PreviewBlock type={block.type} payload={block.payload} />
          </li>
        ))}
      </ol>

      {version.sources.length > 0 && (
        <section className="sources" aria-labelledby="preview-sources-heading">
          <h2 id="preview-sources-heading">Sources</h2>
          <ul>
            {version.sources.map((source) => (
              <li key={source.id}>{source.label}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
