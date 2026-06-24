import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const PUBLIC_PAGES = [
  "/",
  "/modules",
  "/modules/deepfakes-information",
  "/account/register",
  "/accessibilite",
] as const;

for (const route of PUBLIC_PAGES) {
  test(`axe finds no WCAG A/AA violation on ${route}`, async ({ page }) => {
    await page.goto(route);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}

test("core public journeys reflow at 320 CSS pixels", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  for (const route of PUBLIC_PAGES) {
    await page.goto(route);
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
    }));
    expect(dimensions.content, `${route} overflows horizontally`).toBeLessThanOrEqual(
      dimensions.viewport,
    );
  }
});
