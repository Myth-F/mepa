import type { DraftBlockInput } from "@/modules/authoring/module-service";
import { BLOCK_TYPES, type BlockType } from "@/modules/authoring/blocks/registry";

const LETTERS = "abcdefghijklmnopqrstuvwxyz";

export interface ParsedDraftBlocks {
  blocks: DraftBlockInput[];
  errors: string[];
}

export function isEditableBlockType(value: string): value is BlockType {
  return (BLOCK_TYPES as readonly string[]).includes(value);
}

function field(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

function lines(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseQuizOptions(value: string): Array<{ key: string; label: string; correct: boolean }> {
  return lines(value).map((line, index) => {
    const correct = line.endsWith("*");
    const label = correct ? line.slice(0, -1).trim() : line;
    return {
      key: LETTERS[index] ?? String(index + 1),
      label,
      correct,
    };
  });
}

function parseDilemmaOptions(value: string): Array<{ key: string; label: string }> {
  return lines(value).map((label, index) => ({
    key: LETTERS[index] ?? String(index + 1),
    label,
  }));
}

function parseBlock(formData: FormData, index: number): DraftBlockInput | string | null {
  const enabled = formData.get(`block-${index}-enabled`) === "on";
  if (!enabled) return null;

  const type = field(formData, `block-${index}-type`);
  if (!isEditableBlockType(type)) return `Bloc ${index + 1} : type de bloc invalide.`;

  switch (type) {
    case "rich_text":
      return {
        type,
        schemaVersion: 1,
        payload: { markdown: field(formData, `block-${index}-markdown`) },
      };
    case "quiz":
      return {
        type,
        schemaVersion: 1,
        payload: {
          question: field(formData, `block-${index}-question`),
          options: parseQuizOptions(field(formData, `block-${index}-options`)),
          explanation: field(formData, `block-${index}-explanation`) || undefined,
          explanationSource:
            field(formData, `block-${index}-source-title`) &&
            field(formData, `block-${index}-source-url`)
              ? {
                  title: field(formData, `block-${index}-source-title`),
                  url: field(formData, `block-${index}-source-url`),
                }
              : undefined,
        },
      };
    case "dilemma":
      return {
        type,
        schemaVersion: 1,
        payload: {
          prompt: field(formData, `block-${index}-prompt`),
          options: parseDilemmaOptions(field(formData, `block-${index}-options`)),
        },
      };
    case "image":
      return {
        type,
        schemaVersion: 1,
        payload: {
          mediaId: field(formData, `block-${index}-mediaId`),
          alt: field(formData, `block-${index}-alt`),
          decorative: formData.get(`block-${index}-decorative`) === "on",
          caption: field(formData, `block-${index}-caption`) || undefined,
        },
      };
  }
}

export function parseDraftBlocksFromForm(formData: FormData): ParsedDraftBlocks {
  const slotCount = Math.max(0, Number(formData.get("blockSlotCount")) || 0);
  const parsed: Array<{ order: number; block: DraftBlockInput }> = [];
  const errors: string[] = [];

  for (let index = 0; index < slotCount; index += 1) {
    const result = parseBlock(formData, index);
    if (!result) continue;
    if (typeof result === "string") {
      errors.push(result);
      continue;
    }
    const order = Number(formData.get(`block-${index}-order`));
    parsed.push({ order: Number.isFinite(order) ? order : index + 1, block: result });
  }

  return {
    blocks: parsed.sort((a, b) => a.order - b.order).map((item) => item.block),
    errors,
  };
}

export function quizOptionsToText(payload: unknown): string {
  const options = (payload as { options?: Array<{ label?: unknown; correct?: unknown }> }).options;
  if (!Array.isArray(options)) return "";
  return options
    .map((option) => {
      const label = typeof option.label === "string" ? option.label : "";
      return `${label}${option.correct ? " *" : ""}`;
    })
    .join("\n");
}

export function dilemmaOptionsToText(payload: unknown): string {
  const options = (payload as { options?: Array<{ label?: unknown }> }).options;
  if (!Array.isArray(options)) return "";
  return options.map((option) => (typeof option.label === "string" ? option.label : "")).join("\n");
}
