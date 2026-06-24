import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { prisma } from "../../src/shared/db/prisma";

test("quiz and dilemma gate completion without losing the reading position", async ({ page }) => {
  const suffix = randomUUID();
  await page.goto("/account/register");
  await page.getByLabel("Prénom ou pseudonyme").fill(`Parcours ${suffix.slice(0, 8)}`);
  await page.getByLabel("Adresse e-mail").fill(`learning-${suffix}@example.test`);
  await page.getByLabel("Mot de passe").fill("learning-password-1");
  await page.getByRole("button", { name: "Créer mon espace" }).click();
  await expect(page).toHaveURL(/\/account\/dashboard$/);

  const version = await prisma.moduleVersion.findFirstOrThrow({
    where: { status: "PUBLISHED", module: { slug: "deepfakes-information" } },
    select: { id: true },
  });
  const bypass = await page.evaluate(async (moduleVersionId) => {
    const response = await fetch(`/api/learner/modules/${moduleVersionId}/complete`, {
      method: "POST",
    });
    return { status: response.status, body: await response.json() };
  }, version.id);
  expect(bypass.status).toBe(422);
  expect(bypass.body).toEqual(
    expect.objectContaining({ missingQuizCount: 1, missingDilemmaCount: 1 }),
  );

  await page.goto("/modules/deepfakes-information");
  const completion = page.getByRole("button", { name: "Marquer le module comme terminé" });
  await expect(completion).toBeDisabled();
  await expect(page.locator("#completion-help")).toContainText("1 quiz et 1 dilemme");

  const steps = page.locator(".module-step");
  await steps
    .first()
    .getByRole("button", { name: /Étape suivante/ })
    .click();
  await expect(steps.nth(1)).toBeFocused();

  await steps
    .nth(1)
    .getByLabel("Chercher la source d'origine et des confirmations indépendantes")
    .check();
  await steps.nth(1).getByRole("button", { name: "Vérifier ma réponse" }).click();
  await expect(page).toHaveURL(/#feedback-/);
  const quizFeedback = steps.nth(1).locator(".alert[role='status']");
  await expect(quizFeedback).toContainText("Bonne réponse enregistrée");
  await expect(quizFeedback).toBeInViewport();
  await expect(steps.nth(1).locator(".quiz-explanation")).toContainText("Pourquoi ?");
  await expect(steps.nth(1).locator(".choice--correct")).toContainText("Bonne réponse");
  await expect(steps.nth(1).locator(".quiz-explanation a")).toContainText("Consulter la source");
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(100);
  await expect(completion).toBeDisabled();

  await steps.nth(2).getByLabel("Attendre des confirmations fiables avant de partager").check();
  await steps.nth(2).getByRole("button", { name: "Valider mon choix" }).click();
  await expect(steps.nth(2).locator(".alert[role='status']")).toContainText(
    "Votre choix est enregistré",
  );
  await expect(completion).toBeEnabled();
  await completion.click();
  await expect(page.locator("#module-completion .alert[role='status']")).toContainText(
    "Vous gagnez 50 points",
  );
});

test("an incorrect answer still explains and identifies the correct option", async ({ page }) => {
  const suffix = randomUUID();
  await page.goto("/account/register");
  await page.getByLabel("Prénom ou pseudonyme").fill(`Explication ${suffix.slice(0, 8)}`);
  await page.getByLabel("Adresse e-mail").fill(`explanation-${suffix}@example.test`);
  await page.getByLabel("Mot de passe").fill("explanation-password-1");
  await page.getByRole("button", { name: "Créer mon espace" }).click();
  await expect(page).toHaveURL(/\/account\/dashboard$/);
  await page.goto("/modules/deepfakes-information");
  const quiz = page.locator(".module-step").nth(1);
  await quiz.getByLabel("Se fier uniquement au nombre de partages").check();
  await quiz.getByRole("button", { name: "Vérifier ma réponse" }).click();
  await expect(quiz.locator(".quiz-explanation")).toBeVisible();
  await expect(quiz.locator(".choice--incorrect")).toContainText(
    "Se fier uniquement au nombre de partages",
  );
  await expect(quiz.locator(".choice--correct")).toContainText(
    "Chercher la source d'origine et des confirmations indépendantes",
  );
});

test("a quiz without an explanation renders no empty feedback block", async ({ page }) => {
  const slug = `quiz-sans-explication-${randomUUID()}`;
  const learningModule = await prisma.module.create({
    data: {
      slug,
      versions: {
        create: {
          versionNumber: 1,
          status: "PUBLISHED",
          publishedAt: new Date(),
          title: "Quiz sans explication",
          blocks: {
            create: {
              type: "quiz",
              position: 0,
              payload: {
                question: "Une réponse ?",
                options: [
                  { key: "yes", label: "Oui", correct: true },
                  { key: "no", label: "Non", correct: false },
                ],
              },
            },
          },
        },
      },
    },
  });
  try {
    const suffix = randomUUID();
    await page.goto("/account/register");
    await page.getByLabel("Prénom ou pseudonyme").fill(`Sans explication ${suffix.slice(0, 6)}`);
    await page.getByLabel("Adresse e-mail").fill(`no-explanation-${suffix}@example.test`);
    await page.getByLabel("Mot de passe").fill("no-explanation-password-1");
    await page.getByRole("button", { name: "Créer mon espace" }).click();
    await expect(page).toHaveURL(/\/account\/dashboard$/);
    await page.goto(`/modules/${slug}`);
    await page.getByLabel("Oui").check();
    await page.getByRole("button", { name: "Vérifier ma réponse" }).click();
    await expect(page.locator(".quiz-explanation")).toHaveCount(0);
    await expect(page.locator(".choice--correct")).toContainText("Bonne réponse");
  } finally {
    await prisma.module.delete({ where: { id: learningModule.id } });
  }
});

test("the progress indicator and step navigation remain usable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/modules/deepfakes-information");
  const progress = page.getByRole("progressbar", { name: "Avancement dans le module" });
  await expect(progress).toBeVisible();
  await expect(progress).toHaveAttribute("aria-valuetext", /Étape 1 sur 3/);
  await page
    .locator(".module-step")
    .first()
    .getByRole("button", { name: /Étape suivante/ })
    .click();
  await expect(page.locator(".module-step").nth(1)).toBeFocused();
});

test("draft content is not public and module controls work from the keyboard", async ({ page }) => {
  const slug = `draft-only-${randomUUID()}`;
  const draftModule = await prisma.module.create({
    data: {
      slug,
      versions: {
        create: {
          versionNumber: 1,
          status: "DRAFT",
          title: "Contenu confidentiel en brouillon",
          blocks: { create: { type: "rich_text", position: 0, payload: { markdown: "Secret" } } },
        },
      },
    },
  });
  try {
    await page.goto(`/modules/${slug}`);
    await expect(page.getByRole("heading", { name: "Cette page n’est pas disponible" })).toBeVisible();
    await page.goto("/modules");
    await expect(page.getByText("Contenu confidentiel en brouillon")).toHaveCount(0);

    await page.goto("/modules/deepfakes-information");
    const nextStep = page.locator(".module-step").first().getByRole("button", {
      name: /Étape suivante/,
    });
    for (let tabs = 0; tabs < 40; tabs += 1) {
      if (await nextStep.evaluate((element) => element === document.activeElement)) break;
      await page.keyboard.press("Tab");
    }
    await expect(nextStep).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator(".module-step").nth(1)).toBeFocused();
  } finally {
    await prisma.module.delete({ where: { id: draftModule.id } });
  }
});
