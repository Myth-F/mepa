import { expect, test } from "@playwright/test";

test("security headers allow the legitimate UI and preserve visually-hidden content", async ({ page }) => {
  const securityErrors: string[] = [];
  page.on("console", (message) => {
    if (/content security policy|refused to (load|execute|apply)/i.test(message.text())) {
      securityErrors.push(message.text());
    }
  });

  const response = await page.goto("/account/forgot-password");
  expect(response?.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response?.headers()["x-frame-options"]).toBe("DENY");
  expect(response?.headers()["content-security-policy"]).not.toContain("unsafe-eval");
  await expect(page.getByRole("heading", { name: "Mot de passe oublié" })).toBeVisible();

  await page.goto("/modules/deepfakes-information");
  await expect(page.getByRole("link", { name: /Hypertrucage.*nouvel onglet/i })).toBeVisible();
  const visuallyHidden = page.locator(".sources .sr-only");
  const box = await visuallyHidden.boundingBox();
  expect(box?.width).toBeLessThanOrEqual(1);
  expect(box?.height).toBeLessThanOrEqual(1);
  await expect(visuallyHidden).toHaveCSS("clip-path", "inset(50%)");
  expect(securityErrors).toEqual([]);
});
