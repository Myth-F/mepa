import { z } from "zod";

// Each block type owns a Zod schema for its JSONB payload. The schema version is
// tracked separately on the ModuleBlock row so payloads can be migrated per type
// without a database migration.

export const richTextPayloadSchema = z.object({
  markdown: z.string().min(1, "Le texte ne peut pas être vide."),
});

export const imagePayloadSchema = z
  .object({
    mediaId: z.string().min(1, "Une image doit être sélectionnée."),
    alt: z.string().default(""),
    decorative: z.boolean().default(false),
    caption: z.string().optional(),
  })
  .refine((p) => p.decorative || p.alt.trim().length > 0, {
    message: "Une image porteuse de sens doit avoir un texte alternatif.",
    path: ["alt"],
  });

const quizOptionSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1, "Une réponse ne peut pas être vide."),
  correct: z.boolean().default(false),
});

export const quizPayloadSchema = z
  .object({
    question: z.string().min(1, "La question est obligatoire."),
    options: z.array(quizOptionSchema).min(2, "Un quiz doit proposer au moins deux réponses."),
    explanation: z.string().optional(),
  })
  .refine((p) => p.options.some((o) => o.correct), {
    message: "Au moins une réponse correcte est requise.",
    path: ["options"],
  });

const dilemmaOptionSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1, "Une option ne peut pas être vide."),
});

export const dilemmaPayloadSchema = z.object({
  prompt: z.string().min(1, "L'énoncé du dilemme est obligatoire."),
  options: z
    .array(dilemmaOptionSchema)
    .min(2, "Un dilemme doit proposer au moins deux options.")
    .max(6, "Un dilemme ne peut pas dépasser six options."),
});

export type RichTextPayload = z.infer<typeof richTextPayloadSchema>;
export type ImagePayload = z.infer<typeof imagePayloadSchema>;
export type QuizPayload = z.infer<typeof quizPayloadSchema>;
export type DilemmaPayload = z.infer<typeof dilemmaPayloadSchema>;
