import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/shared/db/prisma";
import { ModuleService, PublishedVersionImmutableError } from "./module-service";

const run = process.env.RUN_DB_INTEGRATION === "true";
const suite = describe.runIf(run);
let staffId = "";
let moduleId = "";
let categoryId = "";

suite("module service database integration", () => {
  beforeAll(async () => {
    const staff = await prisma.staffUser.create({
      data: {
        email: `authoring-${randomUUID()}@example.test`,
        name: "Authoring test",
        passwordHash: "not-used",
      },
    });
    staffId = staff.id;
    const category = await prisma.category.create({
      data: {
        slug: `authoring-${randomUUID()}`,
        name: "Authoring integration",
      },
    });
    categoryId = category.id;
  });

  afterAll(async () => {
    if (moduleId) await prisma.module.deleteMany({ where: { id: moduleId } });
    if (categoryId) await prisma.category.deleteMany({ where: { id: categoryId } });
    if (staffId) await prisma.staffUser.deleteMany({ where: { id: staffId } });
  });

  it("publishes immutable versions and starts a classified edit draft", async () => {
    const service = new ModuleService(prisma);
    const created = await service.createModule({
      slug: `authoring-${randomUUID()}`,
      title: "Version initiale",
      summary: "Résumé initial",
      createdByStaffId: staffId,
      classification: {
        categoryId,
        level: "BEGINNER",
        estimatedMinutes: 7,
        language: "fr",
        tags: ["test", "publication"],
      },
    });
    moduleId = created.id;
    const v1 = created.versions[0]!;

    expect(
      await service.setDraftBlocks(v1.id, [
        {
          type: "rich_text",
          schemaVersion: 1,
          payload: { markdown: "Contenu publié." },
        },
      ]),
    ).toEqual({ ok: true, errors: [] });

    expect(await service.publish(v1.id)).toMatchObject({ ok: true });
    await expect(service.setDraftBlocks(v1.id, [])).rejects.toBeInstanceOf(
      PublishedVersionImmutableError,
    );

    const draft = await service.startEdit(moduleId);
    expect(draft.versionNumber).toBe(2);
    expect(draft.status).toBe("DRAFT");
    expect(draft.categoryId).toBe(categoryId);
    expect(draft.level).toBe("BEGINNER");
    expect(draft.estimatedMinutes).toBe(7);
    expect(draft.tags).toEqual(["test", "publication"]);

    await prisma.moduleVersion.update({
      where: { id: draft.id },
      data: { title: "Version suivante" },
    });
    expect(await service.publish(draft.id)).toMatchObject({ ok: true });

    const versions = await prisma.moduleVersion.findMany({
      where: { moduleId },
      orderBy: { versionNumber: "asc" },
    });
    expect(versions.map((version) => version.status)).toEqual(["ARCHIVED", "PUBLISHED"]);
  });
});
