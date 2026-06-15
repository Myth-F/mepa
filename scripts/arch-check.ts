/**
 * Lightweight architecture boundary check (task 1.2).
 *
 * Rules enforced:
 *  1. Domain code under src/modules MUST NOT import Next.js (`next` / `next/*`).
 *  2. Pure-domain files (contracts, registry, schemas, ports, validation, crypto,
 *     context-builder) MUST NOT import the concrete Prisma singleton
 *     (`@/shared/db/prisma`). They may depend on the generated PrismaClient *type*
 *     only, injected via constructor — never the live client module.
 *
 * Exits non-zero on any violation so CI fails fast.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = join(process.cwd(), "src");
const MODULES = join(ROOT, "modules");

const PURE_DOMAIN = /(contracts|registry|schemas|port|validation|crypto|context-builder)\.ts$/;

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (full.endsWith(".ts") || full.endsWith(".tsx")) out.push(full);
  }
  return out;
}

const violations: string[] = [];
const importRe = /from\s+["']([^"']+)["']/g;

for (const file of walk(MODULES)) {
  const src = readFileSync(file, "utf8");
  const rel = relative(process.cwd(), file);
  const isPure = PURE_DOMAIN.test(file);
  let m: RegExpExecArray | null;
  while ((m = importRe.exec(src))) {
    const spec = m[1]!;
    if (spec === "next" || spec.startsWith("next/")) {
      violations.push(`${rel}: domain module imports Next.js ("${spec}")`);
    }
    if (isPure && spec === "@/shared/db/prisma") {
      violations.push(`${rel}: pure-domain file imports the Prisma singleton (inject the client instead)`);
    }
  }
}

if (violations.length > 0) {
  console.error("Architecture boundary violations:\n" + violations.map((v) => `  - ${v}`).join("\n"));
  process.exit(1);
}
console.log("Architecture boundaries OK");
