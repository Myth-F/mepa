import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";

test("the public leaderboard exposes accessible pseudonymous columns only", async ({ page }) => {
  await page.goto("/leaderboard");
  await expect(
    page.getByRole("heading", { name: "Classement des personnes apprenantes" }),
  ).toBeVisible();
  const table = page.getByRole("table");
  if (await table.count()) {
    await expect(table.getByRole("columnheader", { name: "Rang" })).toBeVisible();
    await expect(table.getByRole("columnheader", { name: "Pseudonyme" })).toBeVisible();
    await expect(table.getByRole("columnheader", { name: "Niveau" })).toBeVisible();
    await expect(table.getByRole("columnheader", { name: "Points" })).toBeVisible();
    await expect(table.getByRole("columnheader", { name: /e-mail/i })).toHaveCount(0);
  }
});

test("an unauthenticated visitor cannot change leaderboard participation", async ({ page }) => {
  await page.goto("/account");
  await expect(page).toHaveURL(/\/account\/sign-in$/);
  await expect(page.getByRole("checkbox", { name: /classement/i })).toHaveCount(0);
});

test("a learner can opt in and leave without exposing their email", async ({ page }) => {
  const suffix = randomUUID();
  const pseudonym = `Apprenant ${suffix.slice(0, 8)}`;
  const email = `gamification-${suffix}@example.test`;

  await page.goto("/account/register");
  await page.getByLabel("Prénom ou pseudonyme").fill(pseudonym);
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe").fill("test-password-strong");
  await page.getByRole("button", { name: "Créer mon espace" }).click();

  const participation = page.getByRole("checkbox", {
    name: "Afficher mon pseudonyme dans le classement",
  });
  await expect(participation).not.toBeChecked();
  await participation.check();
  await page.getByRole("button", { name: "Enregistrer mon choix" }).click();
  await expect(page.getByRole("status")).toContainText("apparaissez maintenant");

  await page.goto("/leaderboard");
  await expect(page.getByRole("row", { name: new RegExp(pseudonym) })).toBeVisible();
  await expect(page.getByText(email)).toHaveCount(0);

  await page.goto("/account");
  await page
    .getByRole("checkbox", { name: "Afficher mon pseudonyme dans le classement" })
    .uncheck();
  await page.getByRole("button", { name: "Enregistrer mon choix" }).click();
  await expect(page.getByRole("status")).toContainText("n’apparaissez plus");
  await page.goto(`/leaderboard?after-opt-out=${Date.now()}`);
  await expect(page.locator("table").getByText(pseudonym)).toHaveCount(0);

  await page.goto("/account");
  await page.getByRole("button", { name: "Supprimer mon espace" }).click();
});
