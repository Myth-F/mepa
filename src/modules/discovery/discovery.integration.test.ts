import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/shared/db/prisma";
import { ModuleService } from "@/modules/authoring/module-service";
import { PostgresSearch } from "./postgres-search";
import { recomputeSearchDocuments, writeSearchDocument } from "./search-document";

const suite = describe.runIf(process.env.RUN_DB_INTEGRATION === "true");
const moduleIds: string[] = [];
const categoryIds: string[] = [];
let staffId = "";

suite("discovery PostgreSQL integration", () => {
  beforeAll(async () => {
    const suffix = randomUUID();
    const staff = await prisma.staffUser.create({
      data: {
        email: `discovery-${suffix}@example.test`,
        name: "Discovery test",
        passwordHash: "not-used",
      },
    });
    staffId = staff.id;
    for (const [slug, name] of [
      [`equite-${suffix}`, "Équité"],
      [`travail-${suffix}`, "Travail"],
    ] as const) {
      const category = await prisma.category.create({ data: { slug, name } });
      categoryIds.push(category.id);
    }
  });

  afterAll(async () => {
    await prisma.module.deleteMany({ where: { id: { in: moduleIds } } });
    await prisma.category.deleteMany({ where: { id: { in: categoryIds } } });
    if (staffId) await prisma.staffUser.deleteMany({ where: { id: staffId } });
  });

  it("builds, ranks, filters, removes and exactly recomputes published documents", async () => {
    const service = new ModuleService(prisma);
    const suffix = randomUUID();
    const uniqueTag = `integration-${suffix}`;
    const first = await service.createModule({
      slug: `equite-algorithmique-${suffix}`,
      title: "Équitest algorithmique",
      summary: "Comprendre les biais dans les décisions.",
      createdByStaffId: staffId,
      classification: {
        categoryId: categoryIds[0],
        level: "BEGINNER",
        estimatedMinutes: 8,
        tags: [uniqueTag, "décision"],
      },
    });
    moduleIds.push(first.id);
    await service.setDraftBlocks(first.versions[0]!.id, [
      {
        type: "rich_text",
        schemaVersion: 1,
        payload: { markdown: "Les données historiques peuvent reproduire des inégalités." },
      },
    ]);
    await service.publish(first.versions[0]!.id);

    const second = await service.createModule({
      slug: `recrutement-${suffix}`,
      title: "Recrutement automatisé",
      summary: "Lire une décision automatisée.",
      createdByStaffId: staffId,
      classification: {
        categoryId: categoryIds[1],
        level: "INTERMEDIATE",
        estimatedMinutes: 15,
        tags: ["travail", "décision"],
      },
    });
    moduleIds.push(second.id);
    await service.setDraftBlocks(second.versions[0]!.id, [
      {
        type: "rich_text",
        schemaVersion: 1,
        payload: { markdown: "L'équitest demande un contrôle humain du recrutement." },
      },
    ]);
    await service.publish(second.versions[0]!.id);

    const draftOnly = await service.createModule({
      slug: `secret-${suffix}`,
      title: "Secret non publié",
      createdByStaffId: staffId,
    });
    moduleIds.push(draftOnly.id);

    const firstDocument = await prisma.moduleSearchDocument.findUniqueOrThrow({
      where: { moduleId: first.id },
    });
    expect(firstDocument.body).toContain("données historiques");
    expect(firstDocument.tags).toEqual([uniqueTag, "décision"]);
    expect(
      await prisma.moduleSearchDocument.findUnique({ where: { moduleId: draftOnly.id } }),
    ).toBeNull();

    const search = new PostgresSearch(prisma);
    const accentInsensitive = await search.search({ q: "EQUITEST", sort: "relevance" });
    expect(accentInsensitive.hits.slice(0, 2).map((hit) => hit.moduleId)).toEqual([
      first.id,
      second.id,
    ]);
    const filtered = await search.search({
      filters: { categories: [firstDocument.categorySlug!], levels: ["BEGINNER"] },
    });
    expect(filtered.hits.map((hit) => hit.moduleId)).toEqual([first.id]);
    const tags = await search.search({ filters: { tags: [uniqueTag, "décision"] } });
    expect(tags.hits.map((hit) => hit.moduleId)).toEqual([first.id]);
    expect((await search.search({ q: `introuvable-${suffix}` })).total).toBe(0);

    await prisma.moduleVersion.update({
      where: { id: first.versions[0]!.id },
      data: { status: "ARCHIVED" },
    });
    await prisma.$transaction((tx) => writeSearchDocument(tx, first.id));
    expect(
      await prisma.moduleSearchDocument.findUnique({ where: { moduleId: first.id } }),
    ).toBeNull();

    await prisma.moduleVersion.update({
      where: { id: first.versions[0]!.id },
      data: { status: "PUBLISHED" },
    });
    await prisma.$transaction((tx) => writeSearchDocument(tx, first.id));
    const expected = await prisma.moduleSearchDocument.findUniqueOrThrow({
      where: { moduleId: first.id },
      omit: { updatedAt: true },
    });
    await prisma.moduleSearchDocument.update({
      where: { moduleId: first.id },
      data: { title: "Document désynchronisé" },
    });
    await prisma.moduleSearchDocument.delete({ where: { moduleId: second.id } });
    await recomputeSearchDocuments(prisma);
    const rebuilt = await prisma.moduleSearchDocument.findUniqueOrThrow({
      where: { moduleId: first.id },
      omit: { updatedAt: true },
    });
    expect(rebuilt).toEqual(expected);
    expect(
      await prisma.moduleSearchDocument.findUnique({ where: { moduleId: second.id } }),
    ).not.toBeNull();
  });
});
