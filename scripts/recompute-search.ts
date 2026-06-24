/**
 * Rebuild every module's discovery document from published content (task 1.4).
 * Use after a rule/projection change, or once after deploying discovery to
 * backfill existing modules:  npm run search:recompute
 */
import { prisma } from "../src/shared/db/prisma";
import { recomputeSearchDocuments } from "../src/modules/discovery/search-document";

async function main() {
  const written = await recomputeSearchDocuments(prisma);
  console.log(`Recomputed discovery documents for ${written} module(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
