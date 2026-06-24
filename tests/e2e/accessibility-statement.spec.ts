import { expect, test } from "@playwright/test";

test("the accessibility statement is indexed, structured and linked globally", async ({ page }) => {
  for (const path of ["/", "/modules/deepfakes-information", "/account/sign-in"]) {
    await page.goto(path);
    const link = page.getByRole("contentinfo").getByRole("link", { name: /Accessibilité/ });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", "/accessibilite");
  }

  await page.goto("/accessibilite");
  await expect(
    page.getByRole("heading", { level: 1, name: "Déclaration d’accessibilité" }),
  ).toBeVisible();
  await expect(page.getByRole("main").getByRole("heading", { level: 2 })).toHaveCount(4);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /index/);
  const report = page.getByRole("link", { name: /Ouvrir le formulaire de signalement/ });
  await report.focus();
  await expect(report).toBeFocused();
  await expect(report).toHaveAttribute("href", "https://github.com/Myth-F/mepa/issues/new");
});

test("the statement reflows on a narrow viewport", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/accessibilite");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await expect(page.getByRole("navigation", { name: "Sommaire de la déclaration" })).toBeVisible();
});
