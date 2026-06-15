import { z } from "zod";
import {
  richTextPayloadSchema,
  imagePayloadSchema,
  quizPayloadSchema,
  dilemmaPayloadSchema,
  type RichTextPayload,
  type ImagePayload,
  type QuizPayload,
  type DilemmaPayload,
} from "./schemas";

export const BLOCK_TYPES = ["rich_text", "image", "quiz", "dilemma"] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];

/** A block whose interactive state (quiz/dilemma) requires a learner response to
 *  count toward module completion. */
export type BlockInteraction = "none" | "quiz" | "dilemma";

/**
 * Domain definition of a block type. UI concerns (React admin editor, learner
 * renderer) live in the presentation layer and are registered separately, so
 * this registry stays free of any framework dependency and can be reused by the
 * AI module-context builder.
 */
export interface BlockDefinition<TPayload = unknown> {
  type: BlockType;
  /** Current payload schema version this definition validates against. */
  schemaVersion: number;
  // ZodTypeAny because schemas use `.default()`/`.refine()`, whose input type
  // differs from the parsed output (TPayload). Parsing always yields TPayload.
  schema: z.ZodTypeAny;
  interaction: BlockInteraction;
  /** Human label for the admin block palette. */
  label: string;
  /** Normalized plain-text projection used for previews and tutor context. */
  projectText: (payload: TPayload) => string;
}

const richText: BlockDefinition<RichTextPayload> = {
  type: "rich_text",
  schemaVersion: 1,
  schema: richTextPayloadSchema,
  interaction: "none",
  label: "Texte",
  projectText: (p) => p.markdown.trim(),
};

const image: BlockDefinition<ImagePayload> = {
  type: "image",
  schemaVersion: 1,
  schema: imagePayloadSchema,
  interaction: "none",
  label: "Image",
  projectText: (p) => {
    const parts: string[] = [];
    if (p.caption) parts.push(p.caption.trim());
    if (!p.decorative && p.alt.trim()) parts.push(`[image : ${p.alt.trim()}]`);
    return parts.join(" ");
  },
};

const quiz: BlockDefinition<QuizPayload> = {
  type: "quiz",
  schemaVersion: 1,
  schema: quizPayloadSchema,
  interaction: "quiz",
  label: "Quiz",
  projectText: (p) => {
    const options = p.options.map((o) => `- ${o.label}`).join("\n");
    const explanation = p.explanation ? `\n${p.explanation.trim()}` : "";
    return `${p.question.trim()}\n${options}${explanation}`;
  },
};

const dilemma: BlockDefinition<DilemmaPayload> = {
  type: "dilemma",
  schemaVersion: 1,
  schema: dilemmaPayloadSchema,
  interaction: "dilemma",
  label: "Dilemme éthique",
  projectText: (p) => {
    const options = p.options.map((o) => `- ${o.label}`).join("\n");
    return `${p.prompt.trim()}\n${options}`;
  },
};

const REGISTRY: { [K in BlockType]: BlockDefinition } = {
  rich_text: richText as BlockDefinition,
  image: image as BlockDefinition,
  quiz: quiz as BlockDefinition,
  dilemma: dilemma as BlockDefinition,
};

export function isBlockType(value: string): value is BlockType {
  return (BLOCK_TYPES as readonly string[]).includes(value);
}

export function getBlockDefinition(type: string): BlockDefinition | undefined {
  return isBlockType(type) ? REGISTRY[type] : undefined;
}

export interface ParsedBlock {
  type: BlockType;
  schemaVersion: number;
  payload: unknown;
}

export type BlockValidationResult =
  | { ok: true; value: ParsedBlock }
  | { ok: false; errors: string[] };

/**
 * Validate an untrusted block payload against its registered schema version.
 * Rejects unknown types and unsupported schema versions, so the database never
 * stores arbitrary, unvalidated JSON.
 */
export function validateBlock(
  type: string,
  schemaVersion: number,
  payload: unknown,
): BlockValidationResult {
  const def = getBlockDefinition(type);
  if (!def) {
    return { ok: false, errors: [`Type de bloc inconnu : « ${type} ».`] };
  }
  if (schemaVersion !== def.schemaVersion) {
    return {
      ok: false,
      errors: [
        `Version de schéma non supportée pour « ${type} » (attendu ${def.schemaVersion}, reçu ${schemaVersion}).`,
      ],
    };
  }
  const parsed = def.schema.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map(
        (i) => `${i.path.join(".") || "(bloc)"} : ${i.message}`,
      ),
    };
  }
  return { ok: true, value: { type: def.type, schemaVersion, payload: parsed.data } };
}

/** Project a validated stored block to normalized text (preview / tutor context). */
export function projectBlockText(type: string, payload: unknown): string {
  const def = getBlockDefinition(type);
  if (!def) return "";
  const parsed = def.schema.safeParse(payload);
  if (!parsed.success) return "";
  return def.projectText(parsed.data);
}
