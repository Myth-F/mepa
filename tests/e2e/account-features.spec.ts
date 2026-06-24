import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { prisma } from "../../src/shared/db/prisma";
import { hashResetToken } from "../../src/modules/identity/password-reset";

test("a learner can reset a forgotten password", async ({ page }) => {
  const suffix = randomUUID();
  const email = `reset-${suffix}@example.test`;
  const displayName = `Reset ${suffix.slice(0, 8)}`;
  await page.goto("/account/register");
  await page.getByLabel("Prénom ou pseudonyme").fill(displayName);
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe").fill("initial-password-1");
  await page.getByRole("button", { name: "Créer mon espace" }).click();
  await page.getByRole("button", { name: "Se déconnecter" }).first().click();

  await page.goto("/account/forgot-password");
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByRole("button", { name: "Recevoir un lien" }).click();
  await expect(page.getByRole("status")).toContainText("Si un compte correspond");

  const learner = await prisma.learner.findUniqueOrThrow({ where: { email } });
  const token = `e2e-${randomUUID()}`;
  await prisma.passwordResetToken.deleteMany({ where: { learnerId: learner.id } });
  await prisma.passwordResetToken.create({
    data: {
      learnerId: learner.id,
      tokenHash: hashResetToken(token),
      expiresAt: new Date(Date.now() + 15 * 60_000),
    },
  });
  await page.goto(`/account/reset-password?token=${encodeURIComponent(token)}`);
  await page.getByLabel("Mot de passe").fill("updated-password-2");
  await page.getByRole("button", { name: "Choisir ce mot de passe" }).click();
  await expect(page.getByRole("status")).toContainText("Mot de passe modifié");

  await page.goto("/account/sign-in");
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe").fill("updated-password-2");
  await page.getByRole("button", { name: "Retrouver ma progression" }).click();
  await expect(page.getByRole("heading", { name: new RegExp(displayName) })).toBeVisible();
});

test("profile changes and leaderboard privacy are immediate", async ({ page }) => {
  const suffix = randomUUID();
  const email = `profile-${suffix}@example.test`;
  const firstName = `Profil ${suffix.slice(0, 8)}`;
  const newName = `Nouveau ${suffix.slice(0, 8)}`;
  await page.goto("/account/register");
  await page.getByLabel("Prénom ou pseudonyme").fill(firstName);
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe").fill("profile-password-1");
  await page.getByRole("button", { name: "Créer mon espace" }).click();
  await expect(page).toHaveURL(/\/account\/dashboard$/);

  await page.goto("/account/settings");
  await page.getByRole("textbox", { name: "Pseudonyme" }).fill(newName);
  await page.getByRole("checkbox", { name: /classement public/i }).check();
  await page.getByRole("button", { name: "Enregistrer mes paramètres" }).click();
  await expect(page.getByRole("status")).toContainText("enregistrés");
  await page.goto("/leaderboard");
  await expect(page.getByRole("row", { name: new RegExp(newName) })).toBeVisible();

  await page.goto("/account/settings");
  await page.getByRole("checkbox", { name: /classement public/i }).uncheck();
  await page.getByRole("button", { name: "Enregistrer mes paramètres" }).click();
  await expect(page.getByRole("status")).toContainText("enregistrés");
  await page.goto(`/leaderboard?privacy=${Date.now()}`);
  await expect(page.getByRole("row", { name: new RegExp(newName) })).toHaveCount(0);

  await page.goto("/account/settings");
  await page.getByRole("textbox", { name: "Pseudonyme" }).fill("<invalide>");
  await page.getByRole("button", { name: "Enregistrer mes paramètres" }).click();
  await expect(page.locator(".alert[role='alert']")).toContainText("uniquement");
});

test("an active learner session reaches the dashboard and an expired one is rejected", async ({
  page,
}) => {
  const suffix = randomUUID();
  const email = `session-${suffix}@example.test`;
  await page.goto("/account/register");
  await page.getByLabel("Prénom ou pseudonyme").fill(`Session ${suffix.slice(0, 8)}`);
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe").fill("session-password-1");
  await page.getByRole("button", { name: "Créer mon espace" }).click();
  await expect(page).toHaveURL(/\/account\/dashboard$/);

  const learnerSpace = page.getByRole("link", { name: "Espace apprenant" });
  await expect(learnerSpace).toHaveAttribute("href", "/account/dashboard");
  await learnerSpace.click();
  await expect(page.getByRole("heading", { name: /Bonjour/ })).toBeVisible();
  await page.goto("/account/sign-in");
  await expect(page).toHaveURL(/\/account\/dashboard$/);

  const learner = await prisma.learner.findUniqueOrThrow({ where: { email } });
  await prisma.learnerSession.updateMany({
    where: { learnerId: learner.id },
    data: { expiresAt: new Date(Date.now() - 1_000) },
  });
  await page.goto("/account/dashboard");
  await expect(page).toHaveURL(/\/account\/sign-in$/);
  await expect(page.getByRole("heading", { name: "Retrouver ma progression" })).toBeVisible();
});

test("account deletion removes personal data, progress and the active session", async ({
  page,
}) => {
  const suffix = randomUUID();
  const email = `delete-${suffix}@example.test`;
  await page.goto("/account/register");
  await page.getByLabel("Prénom ou pseudonyme").fill(`Suppression ${suffix.slice(0, 8)}`);
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe").fill("deletion-password-1");
  await page.getByRole("button", { name: "Créer mon espace" }).click();
  await expect(page).toHaveURL(/\/account\/dashboard$/);

  const learner = await prisma.learner.findUniqueOrThrow({ where: { email } });
  const version = await prisma.moduleVersion.findFirstOrThrow({ where: { status: "PUBLISHED" } });
  await prisma.moduleCompletion.create({
    data: { learnerId: learner.id, moduleVersionId: version.id },
  });

  await page.goto("/account");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Supprimer mon espace", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("link", { name: "Retrouver ma progression" })).toBeVisible();
  expect(await prisma.learner.findUnique({ where: { id: learner.id } })).toBeNull();
  expect(await prisma.moduleCompletion.count({ where: { learnerId: learner.id } })).toBe(0);

  await page.goto("/account/dashboard");
  await expect(page).toHaveURL(/\/account\/sign-in$/);
});
