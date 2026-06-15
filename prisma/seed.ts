/**
 * Development seed. Creates an editor account, discovery categories, and a few
 * published, classified modules so the catalogue, search, facets and landing
 * showcase are demonstrable locally. Production content is authored through
 * /admin, not seeded.
 */
import { prisma } from "../src/shared/db/prisma";
import { hashPassword } from "../src/modules/identity/crypto";
import { ModuleService, type DraftBlockInput } from "../src/modules/authoring/module-service";
import type { CourseLevel } from "../src/generated/prisma";

async function main() {
  const editor = await prisma.staffUser.upsert({
    where: { email: "editor@example.org" },
    update: {},
    create: {
      email: "editor@example.org",
      name: "Éditeur de démonstration",
      passwordHash: await hashPassword("change-me-please"),
      role: "EDITOR",
    },
  });

  const categories = [
    { slug: "donnees-personnelles", name: "Données personnelles" },
    { slug: "biais-et-equite", name: "Biais et équité" },
    { slug: "decisions-automatisees", name: "Décisions automatisées" },
  ];
  for (const c of categories) {
    await prisma.category.upsert({ where: { slug: c.slug }, update: { name: c.name }, create: c });
  }
  const catId = async (slug: string) =>
    (await prisma.category.findUniqueOrThrow({ where: { slug } })).id;

  const service = new ModuleService(prisma);

  async function seedModule(input: {
    slug: string;
    title: string;
    summary: string;
    categorySlug: string;
    level: CourseLevel;
    minutes: number;
    tags: string[];
    featured?: boolean;
    blocks: DraftBlockInput[];
  }) {
    if (await prisma.module.findUnique({ where: { slug: input.slug } })) return;
    const mod = await service.createModule({
      slug: input.slug,
      title: input.title,
      summary: input.summary,
      createdByStaffId: editor.id,
      classification: {
        categoryId: await catId(input.categorySlug),
        level: input.level,
        estimatedMinutes: input.minutes,
        language: "fr",
        tags: input.tags,
      },
    });
    await service.setDraftBlocks(mod.versions[0]!.id, input.blocks);
    const res = await service.publish(mod.versions[0]!.id);
    if (input.featured) {
      await prisma.module.update({ where: { id: mod.id }, data: { featured: true, featuredRank: 1 } });
    }
    console.log(res.ok ? `Published ${input.slug}` : `Failed ${input.slug}: ${res.errors.join("; ")}`);
  }

  await seedModule({
    slug: "biais-algorithmiques",
    title: "Comprendre les biais algorithmiques",
    summary: "Comment des décisions automatisées peuvent reproduire des inégalités.",
    categorySlug: "biais-et-equite",
    level: "BEGINNER",
    minutes: 8,
    tags: ["biais", "équité", "données"],
    featured: true,
    blocks: [
      {
        type: "rich_text",
        schemaVersion: 1,
        payload: {
          markdown:
            "Un système d'IA apprend à partir de données historiques. Si ces données reflètent des inégalités passées, le système peut les reproduire.",
        },
      },
      {
        type: "quiz",
        schemaVersion: 1,
        payload: {
          question: "D'où provient principalement un biais algorithmique ?",
          options: [
            { key: "a", label: "Des données d'entraînement", correct: true },
            { key: "b", label: "De la couleur de l'interface", correct: false },
          ],
          explanation: "Les biais proviennent surtout des données et des choix de conception.",
        },
      },
      {
        type: "dilemma",
        schemaVersion: 1,
        payload: {
          prompt: "Faut-il utiliser un algorithme de tri de CV sans vérification humaine ?",
          options: [
            { key: "yes", label: "Oui, c'est plus rapide" },
            { key: "no", label: "Non, une supervision humaine est nécessaire" },
          ],
        },
      },
    ],
  });

  await seedModule({
    slug: "donnees-personnelles-rgpd",
    title: "Vos données personnelles et le RGPD",
    summary: "Ce que deviennent vos données quand une IA les utilise, et vos droits.",
    categorySlug: "donnees-personnelles",
    level: "BEGINNER",
    minutes: 10,
    tags: ["rgpd", "données", "vie privée", "cnil"],
    blocks: [
      {
        type: "rich_text",
        schemaVersion: 1,
        payload: {
          markdown:
            "Le RGPD encadre l'utilisation de vos données personnelles. Vous disposez de droits : accès, rectification, effacement.",
        },
      },
      {
        type: "quiz",
        schemaVersion: 1,
        payload: {
          question: "Quel droit permet de demander la suppression de vos données ?",
          options: [
            { key: "a", label: "Le droit d'accès", correct: false },
            { key: "b", label: "Le droit à l'effacement", correct: true },
          ],
        },
      },
    ],
  });

  await seedModule({
    slug: "decisions-automatisees-recours",
    title: "Décisions automatisées : comprendre et contester",
    summary: "Quand une machine décide à votre place, comment garder un contrôle humain ?",
    categorySlug: "decisions-automatisees",
    level: "INTERMEDIATE",
    minutes: 12,
    tags: ["décision", "recours", "transparence"],
    blocks: [
      {
        type: "rich_text",
        schemaVersion: 1,
        payload: {
          markdown:
            "Certaines décisions (crédit, emploi, prestations) peuvent être automatisées. La loi prévoit un droit à une intervention humaine.",
        },
      },
      {
        type: "dilemma",
        schemaVersion: 1,
        payload: {
          prompt: "Une demande d'aide est refusée par un algorithme. Que devrait-on garantir ?",
          options: [
            { key: "a", label: "Une explication et un recours humain" },
            { key: "b", label: "Rien, la machine ne se trompe pas" },
          ],
        },
      },
    ],
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
