import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/shared/db/prisma";
import { projectBlockText } from "@/modules/authoring/blocks/registry";
import { Breadcrumb } from "@/shared/ui/breadcrumb";
import { BlockView } from "./block-view";
import { ReaderShell, type ReaderStep } from "./reader-shell";
import { TutorPanel } from "./tutor-panel";
import { AccountInvitation } from "./account-invitation";
import { completeModuleAction } from "./actions";
import { getCurrentLearner } from "@/shared/auth/learner-session";

export const dynamic = "force-dynamic";

const KIND_LABELS: Record<string, string> = {
  rich_text: "Lecture",
  image: "Illustration",
  quiz: "Quiz",
  dilemma: "Dilemme éthique",
};

function truncate(value: string, max: number): string {
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

function stepMeta(block: { id: string; type: string; payload: unknown }): ReaderStep {
  const kind = KIND_LABELS[block.type] ?? "Étape";
  let title = kind;
  if (block.type === "rich_text" || block.type === "quiz" || block.type === "dilemma") {
    const firstLine = projectBlockText(block.type, block.payload)
      .split("\n")
      .map((line) => line.trim())
      .find(Boolean);
    if (firstLine) title = truncate(firstLine, 52);
  }
  return { id: block.id, kind, title };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const version = await prisma.moduleVersion.findFirst({
    where: { status: "PUBLISHED", module: { slug } },
    select: { title: true },
  });
  return { title: version?.title ?? "Module" };
}

const RESULT_MESSAGES: Record<string, string> = {
  "quiz-passed": "Bonne réponse enregistrée.",
  "quiz-failed": "Réponse enregistrée. Vous pouvez relire l’étape et réessayer.",
  "vote-recorded": "Votre choix est enregistré.",
  "module-completed": "Module terminé et progression enregistrée.",
  "choice-required": "Choisissez une réponse avant de valider.",
};

export default async function ModuleRunnerPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ result?: string; points?: string }>;
}) {
  const { slug } = await params;
  const { result, points } = await searchParams;
  const learner = await getCurrentLearner();
  const version = await prisma.moduleVersion.findFirst({
    where: { status: "PUBLISHED", module: { slug } },
    include: {
      blocks: { orderBy: { position: "asc" } },
      sources: true,
    },
  });

  if (!version) notFound();

  const steps = version.blocks.map(stepMeta);

  return (
    <div className="reader-page">
      <Breadcrumb
        items={[
          { label: "Accueil", href: "/" },
          { label: "Comprendre l’IA", href: "/modules" },
          { label: version.title },
        ]}
      />

      <ReaderShell steps={steps} aside={<TutorPanel />}>
        {result && RESULT_MESSAGES[result] && (
          <div className="alert alert--success" role="status">
            <strong>{RESULT_MESSAGES[result]}</strong>
            {Number(points) > 0 && <p>Vous gagnez {points} points.</p>}
          </div>
        )}
        {!learner && <AccountInvitation />}
        <header className="module-heading">
          <p className="eyebrow">Module pédagogique</p>
          <h1>{version.title}</h1>
          {version.summary && <p>{version.summary}</p>}
          <div className="module-heading__meta">
            <span>Lecture guidée</span>
            <span>{version.blocks.length} étapes</span>
            <span>{version.sources.length} sources</span>
          </div>
        </header>

        <ol className="module-steps">
          {version.blocks.map((block, index) => (
            <li key={block.id} id={`step-${block.id}`} tabIndex={-1} className="module-step">
              <p className="module-step__number">
                Étape {index + 1} sur {version.blocks.length}
              </p>
              <BlockView id={block.id} type={block.type} payload={block.payload} slug={slug} />
            </li>
          ))}
        </ol>

        {version.sources.length > 0 && (
          <section className="sources" aria-labelledby="sources-heading">
            <h2 id="sources-heading">Sources pour aller plus loin</h2>
            <p>Consultez les documents utilisés pour préparer ce module.</p>
            <ul>
              {version.sources.map((source) => (
                <li key={source.id}>
                  {source.url ? (
                    <a href={source.url} target="_blank" rel="noreferrer">
                      {source.label} <span className="sr-only">(nouvel onglet)</span>
                    </a>
                  ) : (
                    source.label
                  )}
                  {source.citation ? ` — ${source.citation}` : ""}
                </li>
              ))}
            </ul>
          </section>
        )}
        <section className="module-completion" aria-labelledby="module-completion-heading">
          <h2 id="module-completion-heading">Vous avez terminé la lecture ?</h2>
          <p>Enregistrez ce module dans votre progression et gagnez les points associés.</p>
          <form action={completeModuleAction}>
            <input type="hidden" name="moduleVersionId" value={version.id} />
            <input type="hidden" name="slug" value={slug} />
            <button className="btn" type="submit">
              Marquer le module comme terminé
            </button>
          </form>
        </section>
      </ReaderShell>
    </div>
  );
}
