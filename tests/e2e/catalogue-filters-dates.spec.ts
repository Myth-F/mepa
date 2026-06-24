import { expect, test } from "@playwright/test";

test("multiple themes use union semantics and active tags can be removed or reset", async ({
  page,
}) => {
  await page.goto(
    "/modules?category=citoyennete-numerique&category=impacts-sociaux&sort=recent",
  );
  const active = page.getByRole("region", { name: "Filtres et tri actifs" });
  await expect(active).toContainText("Citoyenneté numérique");
  await expect(active).toContainText("Impacts sociaux");
  await expect(active).toContainText("Tri : Plus récents");
  await expect(page.getByRole("heading", { name: "Deepfakes : repérer les contenus manipulés" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "IA et recrutement : lire entre les lignes" })).toBeVisible();

  await active.getByRole("link", { name: "Retirer le filtre Citoyenneté numérique" }).click();
  await expect(page).not.toHaveURL(/citoyennete-numerique/);
  await expect(page.getByRole("heading", { name: "Deepfakes : repérer les contenus manipulés" })).toHaveCount(0);
  await expect(active).not.toContainText("Citoyenneté numérique");
  await expect(page.getByRole("heading", { name: "IA et recrutement : lire entre les lignes" })).toBeVisible();

  await page.getByRole("link", { name: "Tout réinitialiser" }).first().click();
  await expect(page).toHaveURL(/\/modules$/);
  await expect(page.getByRole("region", { name: "Filtres et tri actifs" })).toHaveCount(0);
  await expect(page.locator('.facet__option[aria-current="true"]')).toHaveCount(0);
});

test("Voir tous les modules clears search, facets and sorting", async ({ page }) => {
  await page.goto("/modules?q=aucun-resultat-introuvable&category=impacts-sociaux&sort=recent");
  await page.getByRole("link", { name: "Voir tous les modules" }).click();
  await expect(page).toHaveURL(/\/modules$/);
  await expect(page.getByRole("region", { name: "Filtres et tri actifs" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Pertinence" })).toHaveAttribute(
    "aria-current",
    "true",
  );
});

test("recent sorting and displayed publication dates match", async ({ page }) => {
  await page.goto("/modules");
  await expect(page.locator(".module-card h2").first()).toContainText(
    "Comprendre les biais algorithmiques",
  );
  await page.getByRole("link", { name: "Plus récents" }).click();
  await expect(page.locator(".module-card h2").first()).toContainText("Hameçonnage augmenté par IA");
  await expect(page.locator(".module-card").first().getByText("Publié le 18 janvier 2026")).toBeVisible();

  await page.locator(".module-card h2").first().getByRole("link").click();
  await expect(page.getByText("Publié le 18 janvier 2026")).toBeVisible();
});
