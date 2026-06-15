import { quizPayloadSchema, type QuizPayload } from "@/modules/authoring/blocks/schemas";

export interface QuizScore {
  score: number;
  maxScore: number;
  /** Per-option-key correctness, for accessible (non-color-only) feedback. */
  correctKeys: string[];
  passed: boolean;
}

/**
 * Score a learner's quiz answer set against a quiz block payload. Pure function:
 * no DB, no framework. `selectedKeys` are the option keys the learner chose.
 * A response is correct when the selected set equals the set of correct options.
 */
export function scoreQuiz(rawPayload: unknown, selectedKeys: string[]): QuizScore {
  const payload: QuizPayload = quizPayloadSchema.parse(rawPayload);
  const correctKeys = payload.options.filter((o) => o.correct).map((o) => o.key);
  const selected = new Set(selectedKeys);
  const correct = new Set(correctKeys);

  const exactMatch =
    selected.size === correct.size && [...correct].every((k) => selected.has(k));

  return {
    score: exactMatch ? 1 : 0,
    maxScore: 1,
    correctKeys,
    passed: exactMatch,
  };
}
