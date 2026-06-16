import { expect, test } from "@playwright/test";

test("a learner session cannot access the staff authoring area", async ({ page }) => {
  await page.goto("/account/sign-in");
  await page.getByLabel("Adresse e-mail").fill("editor@example.org");
  await page.getByLabel("Mot de passe").fill("change-me-please");
  await page.getByRole("button", { name: "Retrouver ma progression" }).click();
  await expect(page).toHaveURL(/\/account$/);

  await page.goto("/admin/modules");
  await expect(page).toHaveURL(/\/admin\/sign-in$/);
  await expect(
    page.getByRole("heading", { name: "Connexion de l’équipe pédagogique" }),
  ).toBeVisible();
});

test("staff can create, preview and publish a module without code changes", async ({ page }) => {
  const slug = `e2e-admin-${Date.now()}`;

  await page.goto("/admin/sign-in");
  await page.getByLabel("Adresse e-mail professionnelle").fill("editor@example.org");
  await page.getByLabel("Mot de passe").fill("change-me-please");
  await page.getByRole("button", { name: "Accéder à l’espace équipe" }).click();
  await expect(page).toHaveURL(/\/admin$/);

  await page.getByRole("link", { name: "Ouvrir l’éditeur" }).click();
  await page.getByRole("link", { name: "Créer un module" }).click();
  await page.getByLabel("Titre du module").fill("Module E2E publié");
  await page.getByLabel("Adresse courte").fill(slug);
  await page.getByLabel("Résumé").fill("Créé depuis l’interface d’édition.");
  await page.getByRole("button", { name: "Créer le brouillon" }).click();
  await expect(page).toHaveURL(/\/admin\/modules\/.+status=created/);

  await page.getByLabel("Créer ce bloc").check();
  await page
    .getByRole("textbox", { name: "Texte", exact: true })
    .fill("Contenu créé et publié depuis l’éditeur admin.");
  await page.getByRole("button", { name: "Enregistrer le brouillon" }).click();
  await expect(page).toHaveURL(/status=saved/);

  await page.getByRole("link", { name: "Prévisualiser" }).first().click();
  await expect(page).toHaveURL(/\/preview/);
  await expect(page.getByText("Contenu créé et publié depuis l’éditeur admin.")).toBeVisible();
  await page.getByRole("button", { name: "Publier cette version" }).click();
  await expect(page).toHaveURL(/status=published/);

  await page.goto(`/modules/${slug}`);
  await expect(page.getByRole("heading", { name: "Module E2E publié" })).toBeVisible();
  await expect(
    page.locator(".module-step p", { hasText: "Contenu créé et publié depuis l’éditeur admin." }),
  ).toBeVisible();
});
