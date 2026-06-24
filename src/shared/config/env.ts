import { z } from "zod";

// Centralized, validated environment access. Server-only — never import from a
// "use client" module. Secrets always come from the environment, never the repo.
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // Database
  DATABASE_URL: z.string().url(),

  // Session / cookies
  SESSION_TTL_HOURS: z.coerce
    .number()
    .int()
    .positive()
    .default(24 * 7),

  // Public application URL and optional transactional-email webhook.
  APP_URL: z.string().url().default("http://localhost:3000"),
  EMAIL_WEBHOOK_URL: z.string().url().optional(),
  EMAIL_WEBHOOK_TOKEN: z.string().min(1).optional(),
  EMAIL_FROM: z.string().min(3).default("MEPA <no-reply@example.org>"),

  // S3-compatible object storage (MinIO by default).
  S3_ENDPOINT: z.string().url(),
  S3_REGION: z.string().default("us-east-1"),
  S3_BUCKET: z.string().min(1),
  S3_ACCESS_KEY_ID: z.string().min(1),
  S3_SECRET_ACCESS_KEY: z.string().min(1),
  // Path-style addressing is required for MinIO.
  S3_FORCE_PATH_STYLE: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),

  // Future AI tutor — disabled by default. No vendor SDK is installed.
  TUTOR_ENABLED: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | undefined;

export function loadEnv(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  cached = parsed.data;
  return cached;
}

export const env: Env = loadEnv();
