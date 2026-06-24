/**
 * Demo seed for local development and closed user-test deployments.
 *
 * The seed is intentionally idempotent: it only creates missing modules, upserts
 * categories/accounts, and inserts progress data with duplicate guards. It must
 * be disabled before a production launch with real editorial content.
 */
import { prisma } from "../src/shared/db/prisma";
import { hashPassword } from "../src/modules/identity/crypto";
import { ModuleService, type DraftBlockInput } from "../src/modules/authoring/module-service";
import { recomputeScore } from "../src/modules/gamification/service";
import type { CourseLevel, ModuleVersion } from "../src/generated/prisma";

const DEMO_PASSWORD = "change-me-please";

interface SeedSource {
  label: string;
  url?: string;
  citation?: string;
}

interface SeedModule {
  slug: string;
  title: string;
  summary: string;
  categorySlug: string;
  level: CourseLevel;
  minutes: number;
  tags: string[];
  featuredRank?: number;
  popularity: number;
  blocks: DraftBlockInput[];
  sources?: SeedSource[];
}

interface PublishedSeedModule extends ModuleVersion {
  module: { slug: string };
  blocks: Array<{ id: string; type: string; payload: unknown }>;
}

const categories = [
  {
    slug: "donnees-personnelles",
    name: "Données personnelles",
    description: "Vie privée, consentement, collecte et droits RGPD.",
  },
  {
    slug: "biais-et-equite",
    name: "Biais et équité",
    description: "Identifier les inégalités produites ou renforcées par les systèmes d'IA.",
  },
  {
    slug: "decisions-automatisees",
    name: "Décisions automatisées",
    description: "Comprendre les décisions assistées par algorithme et les recours possibles.",
  },
  {
    slug: "ia-generative",
    name: "IA générative",
    description: "Usages, limites, hallucinations, images et textes synthétiques.",
  },
  {
    slug: "citoyennete-numerique",
    name: "Citoyenneté numérique",
    description: "Information, réseaux sociaux, sécurité et choix collectifs.",
  },
  {
    slug: "impacts-sociaux",
    name: "Impacts sociaux",
    description: "Travail, environnement, inclusion et organisation de la société.",
  },
];

const modules: SeedModule[] = [
  {
    slug: "biais-algorithmiques",
    title: "Comprendre les biais algorithmiques",
    summary: "Comment des décisions automatisées peuvent reproduire des inégalités.",
    categorySlug: "biais-et-equite",
    level: "BEGINNER",
    minutes: 8,
    tags: ["biais", "équité", "données"],
    featuredRank: 1,
    popularity: 94,
    blocks: [
      richText(
        "Un système d'IA apprend à partir de données historiques. Si ces données reflètent des inégalités passées, le système peut les reproduire.\n\nLe biais ne vient pas seulement du code. Il peut venir du choix des données, de la manière de mesurer la réussite ou des personnes oubliées pendant la conception.",
      ),
      quiz(
        "D'où provient principalement un biais algorithmique ?",
        [
          ["a", "Des données d'entraînement et des choix de conception", true],
          ["b", "Uniquement de la vitesse du serveur", false],
          ["c", "De la couleur de l'interface", false],
        ],
        "Les biais proviennent surtout des données utilisées, des objectifs choisis et des contrôles réalisés avant le déploiement.",
      ),
      dilemma("Faut-il utiliser un algorithme de tri de CV sans vérification humaine ?", [
        ["yes", "Oui, c'est plus rapide"],
        ["no", "Non, une supervision humaine est nécessaire"],
        ["audit", "Seulement avec audits réguliers et explications accessibles"],
      ]),
    ],
    sources: [
      {
        label: "CNIL - Intelligence artificielle",
        url: "https://www.cnil.fr/fr/intelligence-artificielle",
      },
    ],
  },
  {
    slug: "donnees-personnelles-rgpd",
    title: "Vos données personnelles et le RGPD",
    summary: "Ce que deviennent vos données quand une IA les utilise, et vos droits.",
    categorySlug: "donnees-personnelles",
    level: "BEGINNER",
    minutes: 10,
    tags: ["rgpd", "données", "vie privée", "cnil"],
    featuredRank: 2,
    popularity: 88,
    blocks: [
      richText(
        "Une donnée personnelle permet d'identifier directement ou indirectement une personne. Une IA peut utiliser ces données pour recommander, classer, prédire ou personnaliser un service.\n\nLe RGPD donne plusieurs droits : accès, rectification, opposition, effacement et limitation du traitement.",
      ),
      quiz("Quel droit permet de demander la suppression de vos données ?", [
        ["a", "Le droit d'accès", false],
        ["b", "Le droit à l'effacement", true],
        ["c", "Le droit de télécharger une application", false],
      ]),
      dilemma(
        "Une application veut utiliser vos messages pour améliorer son IA. Que faut-il vérifier ?",
        [
          ["consent", "Le consentement, la finalité et la durée de conservation"],
          ["ignore", "Rien, l'amélioration du service suffit"],
          ["delete", "Uniquement la présence d'un bouton de suppression"],
        ],
      ),
    ],
    sources: [
      {
        label: "CNIL - Les droits pour maîtriser vos données personnelles",
        url: "https://www.cnil.fr/fr/les-droits-pour-maitriser-vos-donnees-personnelles",
      },
    ],
  },
  {
    slug: "decisions-automatisees-recours",
    title: "Décisions automatisées : comprendre et contester",
    summary: "Quand une machine décide à votre place, comment garder un contrôle humain ?",
    categorySlug: "decisions-automatisees",
    level: "INTERMEDIATE",
    minutes: 12,
    tags: ["décision", "recours", "transparence"],
    featuredRank: 3,
    popularity: 81,
    blocks: [
      richText(
        "Certaines décisions peuvent être automatisées : crédit, recrutement, orientation, fraude ou prestations. Le risque apparaît quand la personne concernée ne comprend pas la décision ou ne peut pas la contester.\n\nUn bon dispositif prévoit une explication compréhensible, une voie de recours et une intervention humaine réelle.",
      ),
      quiz("Que devrait garantir une décision automatisée importante ?", [
        ["a", "Une explication et un recours humain", true],
        ["b", "Un résultat impossible à contester", false],
        ["c", "Une réponse toujours instantanée", false],
      ]),
      dilemma(
        "Une demande d'aide est refusée par un algorithme. Quelle réponse est la plus juste ?",
        [
          ["explain", "Fournir une explication claire et un contact humain"],
          ["machine", "Considérer que la machine ne se trompe pas"],
          ["repeat", "Demander à la personne de refaire le même formulaire"],
        ],
      ),
    ],
    sources: [
      {
        label: "Défenseur des droits - Algorithmes et services publics",
        url: "https://www.defenseurdesdroits.fr",
      },
    ],
  },
  {
    slug: "ia-generative-fiabilite",
    title: "IA générative : vérifier avant de partager",
    summary: "Pourquoi un chatbot peut répondre avec assurance tout en se trompant.",
    categorySlug: "ia-generative",
    level: "BEGINNER",
    minutes: 9,
    tags: ["chatbot", "hallucination", "vérification"],
    featuredRank: 4,
    popularity: 77,
    blocks: [
      richText(
        "Une IA générative produit une réponse probable à partir de modèles appris. Elle ne vérifie pas automatiquement la vérité de ce qu'elle écrit.\n\nPour un usage sérieux, il faut demander les sources, comparer avec des documents fiables et garder une trace des limites de la réponse.",
      ),
      quiz(
        "Que faire avant de réutiliser une réponse générée par IA dans un document important ?",
        [
          ["a", "La vérifier avec des sources fiables", true],
          ["b", "La copier telle quelle si le ton semble professionnel", false],
          ["c", "Supprimer les phrases qui semblent trop longues", false],
        ],
      ),
      dilemma(
        "Un chatbot donne une réponse médicale très convaincante. Quelle conduite adopter ?",
        [
          ["doctor", "Consulter une source médicale qualifiée ou un professionnel"],
          ["share", "Partager immédiatement la réponse à ses proches"],
          ["trust", "Faire confiance car l'outil répond vite"],
        ],
      ),
    ],
    sources: [
      {
        label: "UNESCO - Guidance for generative AI in education and research",
        url: "https://www.unesco.org/en/articles/guidance-generative-ai-education-and-research",
      },
    ],
  },
  {
    slug: "deepfakes-information",
    title: "Deepfakes : repérer les contenus manipulés",
    summary: "Images, voix et vidéos synthétiques : les bons réflexes avant de croire et partager.",
    categorySlug: "citoyennete-numerique",
    level: "INTERMEDIATE",
    minutes: 11,
    tags: ["deepfake", "information", "médias"],
    featuredRank: 5,
    popularity: 73,
    blocks: [
      richText(
        "Les deepfakes peuvent imiter une voix, un visage ou une scène. Les indices visuels ne suffisent plus toujours, car les outils progressent rapidement.\n\nLe réflexe le plus robuste consiste à vérifier l'origine du contenu, chercher une confirmation indépendante et se méfier des publications qui provoquent une réaction émotionnelle immédiate.",
      ),
      quiz("Quel réflexe est le plus fiable face à une vidéo très surprenante ?", [
        ["a", "Chercher la source d'origine et des confirmations indépendantes", true],
        ["b", "Se fier uniquement au nombre de partages", false],
        ["c", "La croire si elle est en haute définition", false],
      ]),
      dilemma("Une vidéo virale accuse une personne publique, sans source claire. Que faire ?", [
        ["wait", "Attendre des confirmations fiables avant de partager"],
        ["share", "Partager vite pour prévenir tout le monde"],
        ["comment", "Commenter sans vérifier pour donner son avis"],
      ]),
    ],
    sources: [
      {
        label: "CNIL — Hypertrucage (deepfake) : se protéger et signaler",
        url: "https://www.cnil.fr/fr/hypertrucage-deepfake",
        citation: "Consulté le 23 juin 2026",
      },
    ],
  },
  {
    slug: "recommandations-reseaux-sociaux",
    title: "Réseaux sociaux : comprendre les recommandations",
    summary: "Pourquoi certains contenus apparaissent partout dans votre fil.",
    categorySlug: "citoyennete-numerique",
    level: "BEGINNER",
    minutes: 7,
    tags: ["réseaux sociaux", "recommandation", "attention"],
    featuredRank: 6,
    popularity: 69,
    blocks: [
      richText(
        "Les plateformes recommandent des contenus en fonction de signaux comme les clics, le temps passé, les abonnements et les interactions. Ce système peut aider à découvrir des contenus utiles, mais il peut aussi renforcer des habitudes ou amplifier des sujets polarisants.",
      ),
      quiz("Quel signal peut influencer une recommandation ?", [
        ["a", "Le temps passé sur un contenu", true],
        ["b", "La météo locale uniquement", false],
        ["c", "La taille de l'écran uniquement", false],
      ]),
      dilemma(
        "Votre fil montre de plus en plus le même type de contenu anxiogène. Quelle action aide à reprendre du contrôle ?",
        [
          ["settings", "Ajuster ses abonnements, masquer certains contenus et varier ses sources"],
          ["scroll", "Continuer à regarder pour que l'algorithme se calme"],
          ["ignore", "Ne rien faire car les recommandations sont neutres"],
        ],
      ),
    ],
    sources: [
      {
        label: "CNIL/LINC — Des recommandations gourmandes en données personnelles",
        url: "https://linc.cnil.fr/altgorithmes-1-des-recommandations-toujours-plus-gourmandes-en-donnees-personnelles",
        citation: "Consulté le 23 juin 2026",
      },
    ],
  },
  {
    slug: "ia-travail-recrutement",
    title: "IA et recrutement : lire entre les lignes",
    summary: "CV filtrés, tests automatisés, entretiens vidéo : quels risques pour les candidats ?",
    categorySlug: "impacts-sociaux",
    level: "INTERMEDIATE",
    minutes: 13,
    tags: ["travail", "recrutement", "égalité"],
    popularity: 64,
    blocks: [
      richText(
        "Dans le recrutement, l'IA peut aider à trier des candidatures ou repérer des compétences. Mais elle peut aussi réduire une personne à des signaux incomplets.\n\nLes recruteurs doivent pouvoir expliquer les critères, contrôler les écarts de traitement et laisser une place à l'évaluation humaine.",
      ),
      quiz("Quel contrôle est important pour un outil de recrutement automatisé ?", [
        ["a", "Mesurer les écarts de traitement entre groupes de candidats", true],
        ["b", "Masquer tous les critères aux recruteurs", false],
        ["c", "Choisir automatiquement la personne la plus jeune", false],
      ]),
      dilemma(
        "Un outil écarte automatiquement les CV avec une interruption de carrière. Que faut-il faire ?",
        [
          ["review", "Réviser le critère et vérifier son effet discriminant"],
          ["accept", "Accepter le tri car il est automatique"],
          ["hide", "Ne pas informer les candidats"],
        ],
      ),
    ],
    sources: [
      {
        label: "CNIL — IA : comment être en conformité avec le RGPD ?",
        url: "https://www.cnil.fr/fr/intelligence-artificielle/ia-comment-etre-en-conformite-avec-le-rgpd",
        citation: "Consulté le 23 juin 2026",
      },
    ],
  },
  {
    slug: "empreinte-environnementale-ia",
    title: "L'empreinte environnementale de l'IA",
    summary: "Comprendre les ressources nécessaires pour entraîner et utiliser des modèles.",
    categorySlug: "impacts-sociaux",
    level: "ADVANCED",
    minutes: 15,
    tags: ["environnement", "énergie", "sobriété"],
    popularity: 58,
    blocks: [
      richText(
        "L'IA consomme des ressources pour entraîner les modèles, stocker les données et répondre aux requêtes. L'impact dépend de la taille du modèle, du matériel, du mix électrique et du volume d'usage.\n\nLa sobriété consiste à choisir un outil adapté au besoin, éviter les traitements inutiles et mesurer les bénéfices réels.",
      ),
      quiz("Quelle pratique va dans le sens d'un usage plus sobre de l'IA ?", [
        ["a", "Choisir le modèle le plus petit qui répond correctement au besoin", true],
        ["b", "Choisir l'outil le plus connu même s'il est surdimensionné", false],
        ["c", "Générer de nombreuses variantes avant de préciser le besoin", false],
      ]),
      dilemma(
        "Une équipe veut générer automatiquement des milliers d'images pour choisir une affiche. Quelle alternative proposer ?",
        [
          ["brief", "Mieux cadrer le besoin et générer moins de variantes pertinentes"],
          ["more", "Générer encore plus pour être sûr"],
          ["none", "Ignorer la question environnementale"],
        ],
      ),
    ],
    sources: [
      {
        label: "ADEME — Regards croisés sur l'impact de l'IA générative",
        url: "https://infos.ademe.fr/magazine-janvier-2025/regards-croises-sur-limpact-de-lia-generative/",
        citation: "Consulté le 23 juin 2026",
      },
    ],
  },
  {
    slug: "cybersecurite-hameconnage-ia",
    title: "Hameçonnage augmenté par IA",
    summary: "Reconnaître les messages frauduleux de plus en plus personnalisés.",
    categorySlug: "citoyennete-numerique",
    level: "INTERMEDIATE",
    minutes: 10,
    tags: ["cybersécurité", "hameçonnage", "email"],
    popularity: 61,
    blocks: [
      richText(
        "L'IA peut aider des fraudeurs à écrire des messages plus crédibles, avec moins de fautes et plus de personnalisation. Les anciens indices ne suffisent donc plus.\n\nAvant de cliquer, il faut vérifier l'adresse de l'expéditeur, le contexte de la demande, l'urgence imposée et le canal officiel de confirmation.",
      ),
      quiz("Quel signal doit alerter dans un message qui demande un paiement urgent ?", [
        ["a", "Une pression à agir vite sans vérification par un canal officiel", true],
        ["b", "Une phrase sans faute d'orthographe", false],
        ["c", "Une signature polie", false],
      ]),
      dilemma(
        "Vous recevez un message vocal imitant votre responsable et demandant un virement. Que faire ?",
        [
          ["confirm", "Confirmer par un canal connu avant toute action"],
          ["pay", "Exécuter rapidement la demande"],
          ["reply", "Répondre au message avec les informations bancaires"],
        ],
      ),
    ],
    sources: [
      {
        label: "Cybermalveillance.gouv.fr — Hameçonnage (phishing)",
        url: "https://www.cybermalveillance.gouv.fr/tous-nos-contenus/fiches-reflexes/hameconnage-phishing",
        citation: "Consulté le 23 juin 2026",
      },
    ],
  },
];

function richText(markdown: string): DraftBlockInput {
  return { type: "rich_text", schemaVersion: 1, payload: { markdown } };
}

function quiz(
  question: string,
  options: Array<[key: string, label: string, correct: boolean]>,
  explanation?: string,
): DraftBlockInput {
  const correctLabels = options
    .filter(([, , correct]) => correct)
    .map(([, label]) => `« ${label} »`)
    .join(" et ");
  return {
    type: "quiz",
    schemaVersion: 1,
    payload: {
      question,
      options: options.map(([key, label, correct]) => ({ key, label, correct })),
      explanation:
        explanation ??
        `La bonne réponse est ${correctLabels}. Elle correspond au principe expliqué dans le module.`,
    },
  };
}

function dilemma(prompt: string, options: Array<[key: string, label: string]>): DraftBlockInput {
  return {
    type: "dilemma",
    schemaVersion: 1,
    payload: {
      prompt,
      options: options.map(([key, label]) => ({ key, label })),
    },
  };
}

async function categoryId(slug: string): Promise<string> {
  return (await prisma.category.findUniqueOrThrow({ where: { slug }, select: { id: true } })).id;
}

async function getPublishedSeedModule(slug: string): Promise<PublishedSeedModule | null> {
  return prisma.moduleVersion.findFirst({
    where: { status: "PUBLISHED", module: { slug } },
    include: {
      module: { select: { slug: true } },
      blocks: { orderBy: { position: "asc" }, select: { id: true, type: true, payload: true } },
    },
  });
}

async function seedModule(
  service: ModuleService,
  editorId: string,
  input: SeedModule,
): Promise<PublishedSeedModule> {
  const existing = await getPublishedSeedModule(input.slug);
  if (existing) {
    await prisma.module.update({
      where: { slug: input.slug },
      data: {
        featured: input.featuredRank !== undefined,
        featuredRank: input.featuredRank ?? null,
      },
    });
    await prisma.moduleSearchDocument.updateMany({
      where: { slug: input.slug },
      data: { popularity: input.popularity },
    });
    if (input.sources?.length) {
      const currentLabels = new Set(
        (
          await prisma.moduleSource.findMany({
            where: { moduleVersionId: existing.id },
            select: { label: true },
          })
        ).map((source) => source.label),
      );
      await prisma.moduleSource.createMany({
        data: input.sources
          .filter((source) => !currentLabels.has(source.label))
          .map((source) => ({
            moduleVersionId: existing.id,
            label: source.label,
            url: source.url,
            citation: source.citation,
          })),
      });
    }
    return existing;
  }

  const mod = await service.createModule({
    slug: input.slug,
    title: input.title,
    summary: input.summary,
    createdByStaffId: editorId,
    classification: {
      categoryId: await categoryId(input.categorySlug),
      level: input.level,
      estimatedMinutes: input.minutes,
      language: "fr",
      tags: input.tags,
    },
  });
  const draft = mod.versions[0]!;
  const primarySource = input.sources?.find((source) => source.url);
  const blocksWithSources = input.blocks.map((block) =>
    block.type === "quiz" && primarySource
      ? {
          ...block,
          payload: {
            ...(block.payload as Record<string, unknown>),
            explanationSource: { title: primarySource.label, url: primarySource.url },
          },
        }
      : block,
  );
  const blocks = await service.setDraftBlocks(draft.id, blocksWithSources);
  if (!blocks.ok) throw new Error(`Invalid blocks for ${input.slug}: ${blocks.errors.join("; ")}`);

  if (input.sources?.length) {
    await prisma.moduleSource.createMany({
      data: input.sources.map((source) => ({
        moduleVersionId: draft.id,
        label: source.label,
        url: source.url,
        citation: source.citation,
      })),
    });
  }

  const published = await service.publish(draft.id);
  if (!published.ok) {
    throw new Error(`Failed to publish ${input.slug}: ${published.errors.join("; ")}`);
  }
  await prisma.module.update({
    where: { id: mod.id },
    data: {
      featured: input.featuredRank !== undefined,
      featuredRank: input.featuredRank ?? null,
    },
  });
  await prisma.moduleSearchDocument.updateMany({
    where: { slug: input.slug },
    data: { popularity: input.popularity },
  });

  const seeded = await getPublishedSeedModule(input.slug);
  if (!seeded) throw new Error(`Published module not found after seed: ${input.slug}`);
  console.log(`Published ${input.slug}`);
  return seeded;
}

function correctAnswerKeys(payload: unknown): string[] {
  const options = (payload as { options?: Array<{ key?: unknown; correct?: unknown }> }).options;
  if (!Array.isArray(options)) return [];
  return options
    .filter((option) => option.correct === true && typeof option.key === "string")
    .map((option) => String(option.key));
}

function firstDilemmaChoice(payload: unknown): string | null {
  const options = (payload as { options?: Array<{ key?: unknown }> }).options;
  const first = Array.isArray(options) ? options[0] : undefined;
  return typeof first?.key === "string" ? first.key : null;
}

async function seedLearnerProgress(input: {
  learnerId: string;
  completedSlugs: string[];
  startedSlugs: string[];
  leaderboardOptIn: boolean;
  modulesBySlug: Map<string, PublishedSeedModule>;
}) {
  const selected = [
    ...input.completedSlugs.map((slug) => ({ slug, complete: true })),
    ...input.startedSlugs.map((slug) => ({ slug, complete: false })),
  ];

  for (const item of selected) {
    const version = input.modulesBySlug.get(item.slug);
    if (!version) continue;

    const quizBlock = version.blocks.find((block) => block.type === "quiz");
    if (quizBlock) {
      const alreadyAttempted = await prisma.quizAttempt.findFirst({
        where: { learnerId: input.learnerId, blockId: quizBlock.id },
        select: { id: true },
      });
      if (!alreadyAttempted) {
        await prisma.quizAttempt.create({
          data: {
            learnerId: input.learnerId,
            moduleVersionId: version.id,
            blockId: quizBlock.id,
            score: 1,
            maxScore: 1,
            answers: correctAnswerKeys(quizBlock.payload),
          },
        });
      }
      await prisma.pointEvent.createMany({
        data: [
          {
            learnerId: input.learnerId,
            moduleVersionId: version.id,
            kind: "QUIZ_PASSED",
            sourceId: quizBlock.id,
            points: 20,
            ruleVersion: 1,
          },
          {
            learnerId: input.learnerId,
            moduleVersionId: version.id,
            kind: "QUIZ_FIRST_TRY_BONUS",
            sourceId: quizBlock.id,
            points: 10,
            ruleVersion: 1,
          },
        ],
        skipDuplicates: true,
      });
    }

    const dilemmaBlock = version.blocks.find((block) => block.type === "dilemma");
    const choice = dilemmaBlock ? firstDilemmaChoice(dilemmaBlock.payload) : null;
    if (dilemmaBlock && choice) {
      const vote =
        (await prisma.dilemmaVote.findUnique({
          where: {
            learnerId_blockId: { learnerId: input.learnerId, blockId: dilemmaBlock.id },
          },
        })) ??
        (await prisma.dilemmaVote.create({
          data: {
            learnerId: input.learnerId,
            moduleVersionId: version.id,
            blockId: dilemmaBlock.id,
            choice,
          },
        }));
      await prisma.pointEvent.createMany({
        data: {
          learnerId: input.learnerId,
          moduleVersionId: version.id,
          kind: "DILEMMA_VOTED",
          sourceId: vote.id,
          points: 5,
          ruleVersion: 1,
        },
        skipDuplicates: true,
      });
    }

    if (item.complete) {
      const completion =
        (await prisma.moduleCompletion.findUnique({
          where: {
            learnerId_moduleVersionId: {
              learnerId: input.learnerId,
              moduleVersionId: version.id,
            },
          },
        })) ??
        (await prisma.moduleCompletion.create({
          data: { learnerId: input.learnerId, moduleVersionId: version.id },
        }));
      await prisma.pointEvent.createMany({
        data: {
          learnerId: input.learnerId,
          moduleVersionId: version.id,
          kind: "MODULE_COMPLETED",
          sourceId: completion.id,
          points: 50,
          ruleVersion: 1,
        },
        skipDuplicates: true,
      });
    }
  }

  await recomputeScore(prisma, input.learnerId);
  await prisma.learnerScore.update({
    where: { learnerId: input.learnerId },
    data: { leaderboardOptIn: input.leaderboardOptIn },
  });
}

async function main() {
  const editor = await prisma.staffUser.upsert({
    where: { email: "editor@example.org" },
    update: {
      name: "Éditeur de démonstration",
      role: "EDITOR",
      active: true,
    },
    create: {
      email: "editor@example.org",
      name: "Éditeur de démonstration",
      passwordHash: await hashPassword(DEMO_PASSWORD),
      role: "EDITOR",
    },
  });

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, description: category.description },
      create: category,
    });
  }

  const service = new ModuleService(prisma);
  const seededModules = await Promise.all(
    modules.map((input) => seedModule(service, editor.id, input)),
  );
  await Promise.all(
    seededModules.map((version, index) => {
      const publishedAt = new Date(Date.UTC(2026, 0, 10 + index));
      return prisma.$transaction([
        prisma.moduleVersion.update({ where: { id: version.id }, data: { publishedAt } }),
        prisma.moduleSearchDocument.updateMany({
          where: { moduleId: version.moduleId },
          data: { publishedAt },
        }),
      ]);
    }),
  );
  const modulesBySlug = new Map(seededModules.map((version) => [version.module.slug, version]));

  const learners = [
    {
      email: "camille.apprenante@example.org",
      displayName: "Camille",
      completedSlugs: [
        "biais-algorithmiques",
        "donnees-personnelles-rgpd",
        "ia-generative-fiabilite",
      ],
      startedSlugs: ["deepfakes-information"],
      leaderboardOptIn: true,
    },
    {
      email: "nour.apprenante@example.org",
      displayName: "Nour",
      completedSlugs: [
        "decisions-automatisees-recours",
        "recommandations-reseaux-sociaux",
        "cybersecurite-hameconnage-ia",
        "biais-algorithmiques",
      ],
      startedSlugs: ["empreinte-environnementale-ia"],
      leaderboardOptIn: true,
    },
    {
      email: "leo.apprenant@example.org",
      displayName: "Léo",
      completedSlugs: ["recommandations-reseaux-sociaux"],
      startedSlugs: ["ia-travail-recrutement", "donnees-personnelles-rgpd"],
      leaderboardOptIn: false,
    },
  ];

  for (const learnerInput of learners) {
    const learner = await prisma.learner.upsert({
      where: { email: learnerInput.email },
      update: { displayName: learnerInput.displayName, deletedAt: null },
      create: {
        email: learnerInput.email,
        displayName: learnerInput.displayName,
        passwordHash: await hashPassword(DEMO_PASSWORD),
      },
    });
    await seedLearnerProgress({
      learnerId: learner.id,
      completedSlugs: learnerInput.completedSlugs,
      startedSlugs: learnerInput.startedSlugs,
      leaderboardOptIn: learnerInput.leaderboardOptIn,
      modulesBySlug,
    });
  }

  console.log("Demo seed complete.");
  console.log(`Staff: editor@example.org / ${DEMO_PASSWORD}`);
  console.log(
    `Learners: camille.apprenante@example.org, nour.apprenante@example.org, leo.apprenant@example.org / ${DEMO_PASSWORD}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
