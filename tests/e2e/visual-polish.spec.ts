import { expect, test } from "@playwright/test";

test("favicon and catalogue details render with restrained states", async ({ page, request }) => {
  await page.goto("/modules");
  const icon = page.locator('link[rel="icon"][sizes="32x32"]');
  const appleIcon = page.locator('link[rel="apple-touch-icon"]');
  await expect(icon).toHaveAttribute("href", /favicon-32x32\.png/);
  await expect(appleIcon).toHaveAttribute("href", /apple-touch-icon\.png/);
  expect((await request.get("/favicon.ico")).ok()).toBe(true);
  expect((await request.get("/favicon-32x32.png")).ok()).toBe(true);
  expect((await request.get("/apple-touch-icon.png")).ok()).toBe(true);

  const selectedSort = page.locator('.sort__option[aria-current="true"]');
  await expect(selectedSort).toHaveCSS("text-decoration-line", "none");
  const firstTag = page.locator(".tag-checkbox").first();
  if (await firstTag.count()) {
    const count = firstTag.locator(".tag-checkbox__count");
    await expect(count).toHaveCSS("opacity", "0");
    await firstTag.hover();
    await expect(count).toHaveCSS("opacity", "1");
  }

  await page.evaluate(() => {
    const button = document.createElement("button");
    button.id = "visual-danger-test";
    button.className = "btn btn--danger";
    document.body.append(button);
  });
  await page.locator("#visual-danger-test").hover();
  const dangerColors = await page.evaluate(() => {
    const button = document.querySelector("#visual-danger-test")!;
    const style = getComputedStyle(button);
    return { background: style.backgroundColor, border: style.borderColor };
  });
  expect(dangerColors.background).not.toBe(dangerColors.border);
});

test("catalogue and module layouts remain usable on desktop and mobile", async ({ page }) => {
  for (const viewport of [
    { width: 1280, height: 800 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/modules");
    await expect(
      page.getByRole("heading", { name: "Comprendre l’IA, un enjeu à la fois" }),
    ).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);

    await page.goto("/modules/deepfakes-information");
    await expect(
      page.getByRole("heading", { name: "Deepfakes : repérer les contenus manipulés" }),
    ).toBeVisible();
    await expect(page.getByText("Assistant pédagogique")).toHaveCount(0);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
});
