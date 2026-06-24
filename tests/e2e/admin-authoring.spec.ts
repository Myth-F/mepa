import { expect, test } from "@playwright/test";
import { prisma } from "../../src/shared/db/prisma";

test.afterEach(async () => {
  await prisma.module.deleteMany({
    where: {
      OR: [{ slug: { startsWith: "e2e-admin-" } }, { slug: { startsWith: "initial-" } }],
    },
  });
});

test("a learner session cannot access the staff authoring area", async ({ page }) => {
  await page.goto("/account/sign-in");
  await page.getByLabel("Adresse e-mail").fill("editor@example.org");
  await page.getByLabel("Mot de passe").fill("change-me-please");
  await page.getByRole("button", { name: "Retrouver ma progression" }).click();
  await expect(page).toHaveURL(/\/account\/dashboard$/);

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
  await page.getByLabel("Date de publication").fill("2025-06-12");
  await page.getByLabel("Catégorie").selectOption({ label: "Citoyenneté numérique" });
  await page.getByLabel("Niveau").selectOption("INTERMEDIATE");
  await page.getByLabel("Durée estimée").fill("14");
  await page.getByLabel("Langue").fill("fr");
  await page.getByLabel("Mots-clés").fill("e2e, pédagogie");
  await page.getByRole("checkbox", { name: "Mettre ce module à la une" }).check();
  await page.getByLabel("Rang à la une").fill("5");
  await page.getByRole("button", { name: "Créer le brouillon" }).click();
  await expect(page).toHaveURL(/\/admin\/modules\/.+status=created/);
  const persisted = await prisma.module.findUniqueOrThrow({
    where: { slug },
    include: { versions: { include: { category: true } } },
  });
  expect(persisted.featured).toBe(true);
  expect(persisted.featuredRank).toBe(5);
  expect(persisted.versions[0]).toMatchObject({
    level: "INTERMEDIATE",
    estimatedMinutes: 14,
    language: "fr",
    tags: ["e2e", "pédagogie"],
    category: { name: "Citoyenneté numérique" },
  });

  await page.getByLabel("Créer ce bloc").check();
  await page
    .getByRole("textbox", { name: "Texte", exact: true })
    .fill("Contenu créé et publié depuis l’éditeur admin.");
  const sources = page.getByRole("region", { name: "Documenter les sources" });
  await sources.getByLabel("Titre de la source").fill("CNIL — Intelligence artificielle");
  await sources
    .getByLabel("Adresse de la source")
    .fill("https://www.cnil.fr/fr/intelligence-artificielle");
  await sources.getByLabel("Référence ou date").fill("Consulté le 23 juin 2026");
  await page.getByRole("button", { name: "Enregistrer le brouillon" }).click();
  await expect(page).toHaveURL(/status=saved/);

  await page.getByRole("link", { name: "Prévisualiser" }).first().click();
  await expect(page).toHaveURL(/\/preview/);
  await expect(page.getByText("Contenu créé et publié depuis l’éditeur admin.")).toBeVisible();
  await expect(page.getByRole("link", { name: "CNIL — Intelligence artificielle" })).toBeVisible();
  await page.getByRole("button", { name: "Publier cette version" }).click();
  await expect(page).toHaveURL(/status=published/);
  const searchDocument = await prisma.moduleSearchDocument.findUniqueOrThrow({
    where: { moduleId: persisted.id },
  });
  expect(searchDocument).toMatchObject({
    level: "INTERMEDIATE",
    estimatedMinutes: 14,
    tags: ["e2e", "pédagogie"],
    categoryName: "Citoyenneté numérique",
  });
  await page.goto(page.url().replace("/preview", ""));
  await expect(page.getByRole("heading", { name: "Historique des versions" })).toBeVisible();
  await expect(page.getByText("Version 1 · PUBLISHED")).toBeVisible();

  await page.goto(`/modules/${slug}`);
  await expect(page.getByRole("heading", { name: "Module E2E publié" })).toBeVisible();
  await expect(
    page.locator(".module-step p", { hasText: "Contenu créé et publié depuis l’éditeur admin." }),
  ).toBeVisible();
  await expect(page.getByText("Publié le 12 juin 2025")).toBeVisible();
  await page.goto("/");
  await expect(
    page
      .getByRole("list", { name: "Modules à la une" })
      .getByRole("link", { name: "Module E2E publié", exact: true }),
  ).toBeVisible();
});

test("three initial sourced modules can be published from the administration interface", async ({
  page,
}) => {
  test.setTimeout(90_000);
  const suffix = Date.now();
  const modules = [
    ["Données et consentement", "cnil"],
    ["Biais et décisions", "defenseur-des-droits"],
    ["Information et contenus synthétiques", "arcom"],
  ] as const;

  await page.goto("/admin/sign-in");
  await page.getByLabel("Adresse e-mail professionnelle").fill("editor@example.org");
  await page.getByLabel("Mot de passe").fill("change-me-please");
  await page.getByRole("button", { name: "Accéder à l’espace équipe" }).click();
  await expect(page).toHaveURL(/\/admin$/);

  for (const [title, sourceKey] of modules) {
    const slug = `initial-${sourceKey}-${suffix}`;
    await page.goto("/admin/modules/new");
    await page.getByLabel("Titre du module").fill(title);
    await page.getByLabel("Adresse courte").fill(slug);
    await page.getByLabel("Résumé").fill("Module pédagogique sourcé créé depuis l’administration.");
    await page.getByRole("button", { name: "Créer le brouillon" }).click();

    await page.getByLabel("Créer ce bloc").check();
    await page
      .getByRole("textbox", { name: "Texte", exact: true })
      .fill(`Contenu pédagogique initial : ${title}.`);
    const sources = page.getByRole("region", { name: "Documenter les sources" });
    await sources.getByLabel("Titre de la source").fill(`Source institutionnelle — ${title}`);
    await sources
      .getByLabel("Adresse de la source")
      .fill(`https://example.org/sources/${sourceKey}`);
    await sources.getByLabel("Référence ou date").fill("Référence vérifiée le 23 juin 2026");
    await page.getByRole("button", { name: "Enregistrer le brouillon" }).click();

    await page.getByRole("link", { name: "Prévisualiser" }).first().click();
    await expect(
      page.getByRole("link", { name: `Source institutionnelle — ${title}` }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Publier cette version" }).click();
    await expect(page).toHaveURL(/status=published/);

    await page.goto(page.url().replace("/preview", ""));
    await expect(page.getByText("Version 1 · PUBLISHED")).toBeVisible();
    await page.goto(`/modules/${slug}`);
    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
    await expect(
      page.getByRole("link", { name: `Source institutionnelle — ${title}` }),
    ).toBeVisible();
  }
});
