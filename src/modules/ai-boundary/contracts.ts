// Provider-neutral contracts for a FUTURE contextual tutor. No vendor SDK is
// installed and no implementation here issues a network request. The only layer
// ever allowed to know vendor-specific request/response formats is a future
// provider adapter that implements `TutorProvider`. Learning and authoring domain
// logic must never import a concrete provider.

/** A tracked source attached to a published module version. */
export interface SourceReference {
  id: string;
  label: string;
  url?: string;
  citation?: string;
}

/** Normalized, trusted projection of a single published module version. */
export interface ModuleContext {
  moduleVersionId: string;
  moduleSlug: string;
  title: string;
  summary: string;
  /** Plain-text projection of the ordered blocks, built from the registry. */
  content: string;
  sources: SourceReference[];
}

export interface TutorRequest {
  /** The learner's question, already sanitized by the caller. */
  question: string;
  /** Trusted context built only from published content. */
  context: ModuleContext;
  /** Optional soft cap the adapter may use to trim its prompt. */
  maxContextChars?: number;
}

export interface TutorResponse {
  answer: string;
  /** Source ids the answer relied on, drawn from the request context. */
  usedSourceIds: string[];
}

/** A conforming tutor provider. Future adapters (any vendor) implement this. */
export interface TutorProvider {
  readonly name: string;
  generate(request: TutorRequest): Promise<TutorResponse>;
}

/** Builds trusted tutor context from a published module version only. */
export interface ModuleContextBuilder {
  /**
   * @returns the normalized context for a PUBLISHED version, or null when the
   * version is a draft/archived version or does not exist. Implementations MUST
   * refuse to project non-published content.
   */
  buildForPublishedVersion(moduleVersionId: string): Promise<ModuleContext | null>;
}
