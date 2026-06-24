import { expect, test, type Locator, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { prisma } from "../../src/shared/db/prisma";

async function tabTo(page: Page, target: Locator, maxTabs = 40) {
  for (let count = 0; count < maxTabs; count += 1) {
    if (await target.evaluate((element) => element === document.activeElement)) return;
    await page.keyboard.press("Tab");
  }
  throw new Error("Le contrôle visé n’est pas atteignable au clavier.");
}

async function shiftTabTo(page: Page, target: Locator, maxTabs = 40) {
  for (let count = 0; count < maxTabs; count += 1) {
    if (await target.evaluate((element) => element === document.activeElement)) return;
    await page.keyboard.press("Shift+Tab");
  }
  throw new Error("Le contrôle visé n’est pas atteignable au clavier.");
}

test("search and tag facets are fully operable with the keyboard", async ({ page }) => {
  await page.goto("/modules");
  const search = page.getByLabel("Rechercher un module");
  await tabTo(page, search);
  await page.keyboard.type("HAMECONNAGE");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/q=HAMECONNAGE/);
  await expect(page.getByRole("status")).toContainText("1 module");

  await page.goto("/modules");
  const tag = page.getByRole("checkbox", { name: "deepfake" });
  await tabTo(page, tag);
  await page.keyboard.press("Space");
  await expect(tag).toBeChecked();
  const submit = page.getByRole("button", { name: "Rechercher" });
  await shiftTabTo(page, submit);
  await expect(submit).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/tags=deepfake/);
  await expect(page.getByRole("region", { name: "Filtres et tri actifs" })).toContainText(
    "deepfake",
  );
});

test("search, sorting, shareable state and no-results guidance", async ({ page }) => {
  await page.goto("/modules?q=HAMECONNAGE&sort=recent");
  await expect(page.getByRole("heading", { name: "Hameçonnage augmenté par IA" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Plus récents", exact: true })).toHaveAttribute(
    "aria-current",
    "true",
  );

  const sharedUrl = page.url();
  await page.reload();
  await expect(page).toHaveURL(sharedUrl);
  await expect(page.getByLabel("Rechercher un module")).toHaveValue("HAMECONNAGE");

  await page.goto("/modules?q=recherche-totalement-introuvable");
  await expect(page.getByRole("heading", { name: "Aucun module ne correspond" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Voir tous les modules" })).toBeVisible();
});

test("facet state remains in the URL and paginated results are reachable", async ({ page }) => {
  const suffix = randomUUID();
  const categorySlug = `pagination-${suffix}`;
  const moduleIds: string[] = [];

  try {
    for (let index = 1; index <= 15; index += 1) {
      const courseModule = await prisma.module.create({
        data: { slug: `${categorySlug}-${index}` },
      });
      moduleIds.push(courseModule.id);
      await prisma.moduleSearchDocument.create({
        data: {
          moduleId: courseModule.id,
          slug: `${categorySlug}-${index}`,
          title: `Résultat pagination ${String(index).padStart(2, "0")}`,
          summary: "Module temporaire de vérification de la pagination.",
          categorySlug,
          categoryName: "Pagination test",
          popularity: 20 - index,
          publishedAt: new Date(`2026-02-${String(index).padStart(2, "0")}T12:00:00Z`),
        },
      });
    }

    await page.goto(`/modules?category=${categorySlug}`);
    await expect(page.getByRole("status")).toContainText("15 modules");
    await expect(page.getByText("Page 1 sur 2")).toBeVisible();
    await page.getByRole("link", { name: "Suivant" }).click();
    await expect(page).toHaveURL(
      new RegExp(`category=${categorySlug}.*page=2|page=2.*category=${categorySlug}`),
    );
    await expect(page.getByText("Page 2 sur 2")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Résultat pagination 13" })).toBeVisible();
  } finally {
    await prisma.module.deleteMany({ where: { id: { in: moduleIds } } });
  }
});

test("first visit, anonymous invitation and returning continuation stay non-blocking", async ({
  page,
}) => {
  await page.context().clearCookies();
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "L’intelligence artificielle vous concerne déjà." }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Modules à la une" })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", { name: "Continuez à comprendre l’IA." })).toBeVisible();
  await page.getByRole("list", { name: "Modules à la une" }).getByRole("link").first().click();
  await expect(page).toHaveURL(/\/modules\//);
  const moduleUrl = page.url();
  await expect(page.getByRole("complementary", { name: "Suggestion" })).toBeVisible();
  await page.getByRole("button", { name: "Plus tard" }).click();
  await expect(page.getByRole("complementary", { name: "Suggestion" })).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(moduleUrl).toContain("/modules/");

  const suffix = randomUUID();
  const email = `continue-${suffix}@example.test`;
  await page.goto("/account/register");
  await page.getByLabel("Prénom ou pseudonyme").fill(`Reprise ${suffix.slice(0, 8)}`);
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe").fill("continuation-password-1");
  await page.getByRole("button", { name: "Créer mon espace" }).click();
  await expect(page).toHaveURL(/\/account\/dashboard$/);

  const learner = await prisma.learner.findUniqueOrThrow({ where: { email } });
  const version = await prisma.moduleVersion.findFirstOrThrow({
    where: { status: "PUBLISHED", blocks: { some: { type: "quiz" } } },
    include: { blocks: { where: { type: "quiz" }, take: 1 }, module: true },
  });
  await prisma.quizAttempt.create({
    data: {
      learnerId: learner.id,
      moduleVersionId: version.id,
      blockId: version.blocks[0]!.id,
      score: 0,
      maxScore: 1,
      answers: [],
    },
  });

  await page.goto("/");
  const continuation = page.getByRole("list", { name: "Modules à reprendre" });
  await expect(page.getByRole("heading", { name: "Là où vous vous êtes arrêté" })).toBeVisible();
  await expect(
    continuation.getByRole("link", { name: new RegExp(version.title) }).first(),
  ).toBeVisible();
});

test("published category pages and sitemap expose canonical public URLs", async ({ page }) => {
  await page.goto("/categories/citoyennete-numerique");
  await expect(
    page.getByRole("heading", { level: 1, name: "Citoyenneté numérique" }),
  ).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    /\/categories\/citoyennete-numerique$/,
  );

  const sitemap = await page.request.get("/sitemap.xml");
  expect(sitemap.ok()).toBeTruthy();
  const xml = await sitemap.text();
  expect(xml).toContain("/categories/citoyennete-numerique");
  expect(xml).toContain("/modules/cybersecurite-hameconnage-ia");
});
