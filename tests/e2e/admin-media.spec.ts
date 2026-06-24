import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { prisma } from "../../src/shared/db/prisma";
import { getMediaStorage } from "../../src/modules/media/s3-adapter";

test("an incomplete draft remains unpublished with actionable errors", async ({ page }) => {
  const slug = `invalid-publication-${randomUUID()}`;
  await page.goto("/admin/sign-in");
  await page.getByLabel("Adresse e-mail professionnelle").fill("editor@example.org");
  await page.getByLabel("Mot de passe").fill("change-me-please");
  await page.getByRole("button", { name: "Accéder à l’espace équipe" }).click();
  await expect(page).toHaveURL(/\/admin$/);

  await page.goto("/admin/modules/new");
  await page.getByLabel("Titre du module").fill("Brouillon incomplet");
  await page.getByLabel("Adresse courte").fill(slug);
  await page.getByRole("button", { name: "Créer le brouillon" }).click();
  await expect(page).toHaveURL(/\/admin\/modules\/.+status=created/);
  const courseModule = await prisma.module.findUniqueOrThrow({ where: { slug } });
  try {
    await page.getByRole("link", { name: "Prévisualiser" }).first().click();
    await expect(page.locator(".alert[role='alert']")).toContainText("au moins un bloc");
    const publish = page.getByRole("button", { name: "Publier cette version" });
    await expect(publish).toBeDisabled();
    await publish.evaluate((button) => button.removeAttribute("disabled"));
    await publish.click();
    await expect(page).toHaveURL(/status=invalid/);
    await expect(page.getByRole("status")).toContainText("Publication impossible");
    const draft = await prisma.moduleVersion.findFirstOrThrow({
      where: { moduleId: courseModule.id },
    });
    expect(draft.status).toBe("DRAFT");
  } finally {
    await prisma.module.delete({ where: { id: courseModule.id } });
  }
});

test("draft-only media is hidden publicly but remains available to staff", async ({ page }) => {
  const staff = await prisma.staffUser.findUniqueOrThrow({
    where: { email: "editor@example.org" },
  });
  const asset = await prisma.mediaAsset.create({
    data: {
      objectKey: `media/e2e/${randomUUID()}.png`,
      mimeType: "image/png",
      sizeBytes: 3,
      altText: "Illustration de test",
      uploadedByStaffId: staff.id,
      uploadedAt: new Date(),
    },
  });
  const courseModule = await prisma.module.create({
    data: {
      slug: `draft-media-${randomUUID()}`,
      createdByStaffId: staff.id,
      versions: {
        create: {
          versionNumber: 1,
          status: "DRAFT",
          title: "Module avec média privé",
          blocks: {
            create: {
              type: "image",
              position: 0,
              payload: {
                mediaId: asset.id,
                alt: "Illustration de test",
                decorative: false,
              },
            },
          },
        },
      },
    },
    include: { versions: true },
  });

  try {
    const hidden = await page.request.get(`/api/media/${asset.id}`, { maxRedirects: 0 });
    expect(hidden.status()).toBe(404);

    await page.goto("/admin/sign-in");
    await page.getByLabel("Adresse e-mail professionnelle").fill("editor@example.org");
    await page.getByLabel("Mot de passe").fill("change-me-please");
    await page.getByRole("button", { name: "Accéder à l’espace équipe" }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await page.goto(`/admin/modules/${courseModule.id}/preview`);
    const image = page.getByRole("img", { name: "Illustration de test" });
    await expect(image).toHaveAttribute("src", `/api/media/${asset.id}`);
  } finally {
    await prisma.module.delete({ where: { id: courseModule.id } });
    await prisma.mediaAsset.delete({ where: { id: asset.id } });
  }
});

test("staff can upload, preview and publish a meaningful image", async ({ page }) => {
  const slug = `uploaded-media-${randomUUID()}`;
  await page.goto("/admin/sign-in");
  await page.getByLabel("Adresse e-mail professionnelle").fill("editor@example.org");
  await page.getByLabel("Mot de passe").fill("change-me-please");
  await page.getByRole("button", { name: "Accéder à l’espace équipe" }).click();
  await expect(page).toHaveURL(/\/admin$/);

  await page.goto("/admin/modules/new");
  await page.getByLabel("Titre du module").fill("Module avec image téléversée");
  await page.getByLabel("Adresse courte").fill(slug);
  await page.getByRole("button", { name: "Créer le brouillon" }).click();
  await expect(page).toHaveURL(/\/admin\/modules\/.+status=created/);
  const courseModule = await prisma.module.findUniqueOrThrow({ where: { slug } });
  let mediaId: string | undefined;
  let objectKey: string | undefined;

  try {
    await page
      .getByLabel("Fichier image")
      .setInputFiles(path.resolve(process.cwd(), "public/favicon-32x32.png"));
    await page.getByLabel("Description de l’image").fill("Logo géométrique de MEPA");
    await page.getByRole("button", { name: "Envoyer l’image" }).click();
    const uploadStatus = page.locator(".form-panel").filter({ hasText: "Ajouter une image" });
    await expect(uploadStatus.getByRole("status")).toContainText("Image prête");
    mediaId = (await uploadStatus.locator("code").textContent()) ?? undefined;
    expect(mediaId).toBeTruthy();
    const asset = await prisma.mediaAsset.findUniqueOrThrow({ where: { id: mediaId } });
    expect(asset.uploadedAt).not.toBeNull();
    objectKey = asset.objectKey;

    await page.getByLabel("Créer ce bloc").check();
    await page.getByLabel("Type").selectOption("image");
    await page.getByLabel("Identifiant média").fill(mediaId!);
    await page.getByLabel("Texte alternatif").fill("Logo géométrique de MEPA");
    await page.getByRole("button", { name: "Enregistrer le brouillon" }).click();
    await expect(page).toHaveURL(/status=saved/);
    await page.getByRole("link", { name: "Prévisualiser" }).first().click();
    const previewImage = page.getByRole("img", { name: "Logo géométrique de MEPA" });
    await expect(previewImage).toBeVisible();
    await expect
      .poll(() => previewImage.evaluate((image: HTMLImageElement) => image.naturalWidth))
      .toBeGreaterThan(0);

    await page.getByRole("button", { name: "Publier cette version" }).click();
    await expect(page).toHaveURL(/status=published/);
    await page.context().clearCookies();
    await page.goto(`/modules/${slug}`);
    const publicImage = page.getByRole("img", { name: "Logo géométrique de MEPA" });
    await expect(publicImage).toBeVisible();
    await expect
      .poll(() => publicImage.evaluate((image: HTMLImageElement) => image.naturalWidth))
      .toBeGreaterThan(0);
  } finally {
    await prisma.module.delete({ where: { id: courseModule.id } });
    if (mediaId) await prisma.mediaAsset.deleteMany({ where: { id: mediaId } });
    if (objectKey) await getMediaStorage().deleteObject(objectKey);
  }
});
