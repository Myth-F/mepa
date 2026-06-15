import type { TutorProvider, TutorRequest, TutorResponse } from "./contracts";

/**
 * A deterministic, offline tutor provider used ONLY by contract tests. It makes
 * no network call and depends on no vendor SDK. It exists to prove the contract
 * is implementable and that swapping providers leaves domain contracts intact.
 */
export class FakeTutorProvider implements TutorProvider {
  readonly name = "fake";

  async generate(request: TutorRequest): Promise<TutorResponse> {
    const { question, context } = request;
    return {
      answer: `À propos de « ${context.title} » : ${question.trim()}`,
      usedSourceIds: context.sources.map((s) => s.id),
    };
  }
}
