import { z } from "zod";
import { validateUpload } from "./validation";

export const mediaUploadInputSchema = z
  .object({
    mimeType: z.string().min(1),
    sizeBytes: z.number().int().positive(),
    altText: z.string().trim().max(500).default(""),
    isDecorative: z.boolean().default(false),
  })
  .superRefine((value, context) => {
    const validation = validateUpload(value.mimeType, value.sizeBytes);
    if (!validation.ok) {
      context.addIssue({ code: "custom", path: ["mimeType"], message: validation.error });
    }
    if (!value.isDecorative && value.altText.length === 0) {
      context.addIssue({
        code: "custom",
        path: ["altText"],
        message: "Décrivez l’image lorsqu’elle apporte une information.",
      });
    }
  });

export type MediaUploadInput = z.infer<typeof mediaUploadInputSchema>;
