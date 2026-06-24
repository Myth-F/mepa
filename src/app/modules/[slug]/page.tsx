import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/shared/db/prisma";
import { projectBlockText } from "@/modules/authoring/blocks/registry";
import { Breadcrumb } from "@/shared/ui/breadcrumb";
import { BlockView } from "./block-view";
import { ReaderShell, type ReaderStep } from "./reader-shell";
import { TutorPanel, tutorIsAvailable } from "./tutor-panel";
import { AccountInvitation } from "./account-invitation";
import { getCurrentLearner } from "@/shared/auth/learner-session";
import { formatSourceCount } from "../source-count";
import { CompletionControl } from "./completion-control";
import { StepNavigation } from "./step-navigation";
import { formatPublishedDate } from "@/modules/discovery/format-date";

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
  return {
    title: version?.title ?? "Module",
    alternates: { canonical: `/modules/${slug}` },
  };
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
  searchParams: Promise<{
    result?: string;
    points?: string;
    focus?: string;
    answer?: string | string[];
  }>;
}) {
  const { slug } = await params;
  const { result, points, focus, answer } = await searchParams;
  const selectedAnswers = Array.isArray(answer) ? answer : answer ? [answer] : [];
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
  const tutor = tutorIsAvailable() ? <TutorPanel /> : null;
  const quizIds = version.blocks.filter((block) => block.type === "quiz").map((block) => block.id);
  const dilemmaIds = version.blocks
    .filter((block) => block.type === "dilemma")
    .map((block) => block.id);
  const [quizAnswers, dilemmaAnswers, existingCompletion] = learner
    ? await Promise.all([
        prisma.quizAttempt.findMany({
          where: { learnerId: learner.id, blockId: { in: quizIds } },
          distinct: ["blockId"],
          select: { blockId: true },
        }),
        prisma.dilemmaVote.findMany({
          where: { learnerId: learner.id, blockId: { in: dilemmaIds } },
          select: { blockId: true },
        }),
        prisma.moduleCompletion.findUnique({
          where: {
            learnerId_moduleVersionId: {
              learnerId: learner.id,
              moduleVersionId: version.id,
            },
          },
          select: { id: true },
        }),
      ])
    : [[], [], null];
  const missingQuizCount = quizIds.length - quizAnswers.length;
  const missingDilemmaCount = dilemmaIds.length - dilemmaAnswers.length;

  return (
    <div className="reader-page">
      <Breadcrumb
        items={[
          { label: "Accueil", href: "/" },
          { label: "Comprendre l’IA", href: "/modules" },
          { label: version.title },
        ]}
      />

      <ReaderShell steps={steps} aside={tutor}>
        {result && !focus && RESULT_MESSAGES[result] && (
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
            <span>{formatSourceCount(version.sources.length)}</span>
            {version.publishedAt && (
              <span>
                <time dateTime={version.publishedAt.toISOString()}>
                  {formatPublishedDate(version.publishedAt)}
                </time>
              </span>
            )}
          </div>
        </header>

        <ol className="module-steps">
          {version.blocks.map((block, index) => (
            <li key={block.id} id={`step-${block.id}`} tabIndex={-1} className="module-step">
              <p className="module-step__number">
                Étape {index + 1} sur {version.blocks.length}
              </p>
              {focus === block.id && result && RESULT_MESSAGES[result] && (
                <div id={`feedback-${block.id}`} className="alert alert--success" role="status">
                  <strong>{RESULT_MESSAGES[result]}</strong>
                  {Number(points) > 0 && <p>Vous gagnez {points} points.</p>}
                </div>
              )}
              <BlockView
                id={block.id}
                type={block.type}
                payload={block.payload}
                slug={slug}
                quizResult={focus === block.id && result?.startsWith("quiz-") ? result : undefined}
                selectedAnswers={focus === block.id ? selectedAnswers : []}
              />
              <StepNavigation
                previous={
                  index > 0
                    ? { id: steps[index - 1]!.id, label: steps[index - 1]!.title }
                    : undefined
                }
                next={
                  index < steps.length - 1
                    ? { id: steps[index + 1]!.id, label: steps[index + 1]!.title }
                    : undefined
                }
              />
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
        <section
          id="module-completion"
          className="module-completion"
          aria-labelledby="module-completion-heading"
        >
          <h2 id="module-completion-heading">Vous avez terminé la lecture ?</h2>
          <p>Enregistrez ce module dans votre progression et gagnez les points associés.</p>
          {learner ? (
            <CompletionControl
              moduleVersionId={version.id}
              missingQuizCount={missingQuizCount}
              missingDilemmaCount={missingDilemmaCount}
              alreadyCompleted={Boolean(existingCompletion)}
            />
          ) : (
            <p className="notice">
              Créez ou retrouvez votre espace personnel pour enregistrer cette progression.
            </p>
          )}
        </section>
      </ReaderShell>
    </div>
  );
}
