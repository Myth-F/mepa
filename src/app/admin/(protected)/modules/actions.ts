"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Route } from "next";
import type { CourseLevel, Prisma } from "@/generated/prisma";
import { requireStaff } from "@/shared/auth/staff-session";
import { prisma } from "@/shared/db/prisma";
import { ModuleService, PublishedVersionImmutableError } from "@/modules/authoring/module-service";
import { parseDraftBlocksFromForm } from "./block-form";

type SaveStatus = "created" | "saved" | "started" | "published" | "invalid" | "immutable";

function statusUrl(moduleId: string, status: SaveStatus): Route {
  return `/admin/modules/${moduleId}?status=${status}` as Route;
}

function previewStatusUrl(moduleId: string, status: SaveStatus): Route {
  return `/admin/modules/${moduleId}/preview?status=${status}` as Route;
}

function normalizeSlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function nullableString(formData: FormData, name: string): string | null {
  const value = String(formData.get(name) ?? "").trim();
  return value.length > 0 ? value : null;
}

function tagsFromForm(formData: FormData): string[] {
  return String(formData.get("tags") ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function levelFromForm(formData: FormData): CourseLevel | null {
  const level = String(formData.get("level") ?? "");
  return level === "BEGINNER" || level === "INTERMEDIATE" || level === "ADVANCED" ? level : null;
}

function minutesFromForm(formData: FormData): number | null {
  const minutes = Number(formData.get("estimatedMinutes"));
  return Number.isInteger(minutes) && minutes > 0 ? minutes : null;
}

function publicationDateFromForm(formData: FormData): Date | null {
  const value = String(formData.get("publishedAt") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T12:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function sourcesFromForm(formData: FormData):
  | { ok: true; sources: { label: string; url: string | null; citation: string | null }[] }
  | { ok: false } {
  const count = Math.max(0, Math.min(20, Number(formData.get("sourceSlotCount")) || 0));
  const sources: { label: string; url: string | null; citation: string | null }[] = [];
  for (let index = 0; index < count; index += 1) {
    const label = nullableString(formData, `source-${index}-label`);
    const url = nullableString(formData, `source-${index}-url`);
    const citation = nullableString(formData, `source-${index}-citation`);
    if (!label && !url && !citation) continue;
    if (!label) return { ok: false };
    if (url) {
      try {
        const parsed = new URL(url);
        if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return { ok: false };
      } catch {
        return { ok: false };
      }
    }
    sources.push({ label, url, citation });
  }
  return { ok: true, sources };
}

function moduleRevalidationPaths(moduleSlug?: string | null) {
  revalidatePath("/admin");
  revalidatePath("/admin/modules");
  revalidatePath("/");
  revalidatePath("/modules");
  if (moduleSlug) revalidatePath(`/modules/${moduleSlug}`);
}

async function updateDraftVersionMetadata(moduleVersionId: string, formData: FormData) {
  const title = nullableString(formData, "title");
  if (!title) throw new Error("Le titre du module est obligatoire.");

  const service = new ModuleService(prisma);
  await service.setDraftMetadata(moduleVersionId, {
    categoryId: nullableString(formData, "categoryId"),
    level: levelFromForm(formData),
    estimatedMinutes: minutesFromForm(formData),
    language: nullableString(formData, "language") ?? "fr",
    tags: tagsFromForm(formData),
  });

  await prisma.moduleVersion.update({
    where: { id: moduleVersionId, status: "DRAFT" },
    data: {
      title,
      summary: String(formData.get("summary") ?? "").trim(),
      publishedAt: publicationDateFromForm(formData),
    },
  });
}

async function updateModuleCuration(moduleId: string, formData: FormData) {
  const featured = formData.get("featured") === "on";
  const featuredRank = Number(formData.get("featuredRank"));
  await prisma.module.update({
    where: { id: moduleId },
    data: {
      featured,
      featuredRank:
        featured && Number.isInteger(featuredRank) && featuredRank > 0 ? featuredRank : null,
    },
  });
}

export async function createModuleAction(formData: FormData): Promise<void> {
  const staff = await requireStaff();
  const title = nullableString(formData, "title");
  if (!title) redirect("/admin/modules/new?error=missing-title" as Route);

  const requestedSlug = nullableString(formData, "slug") ?? title;
  const slug = normalizeSlug(requestedSlug);
  if (!slug) redirect("/admin/modules/new?error=invalid-slug" as Route);

  const service = new ModuleService(prisma);
  let moduleId: string;
  try {
    const mod = await service.createModule({
      slug,
      title,
      summary: String(formData.get("summary") ?? "").trim(),
      createdByStaffId: staff.id,
      classification: {
        categoryId: nullableString(formData, "categoryId"),
        level: levelFromForm(formData),
        estimatedMinutes: minutesFromForm(formData),
        language: nullableString(formData, "language") ?? "fr",
        tags: tagsFromForm(formData),
      },
    });
    moduleId = mod.id;
    await prisma.moduleVersion.updateMany({
      where: { moduleId, status: "DRAFT" },
      data: { publishedAt: publicationDateFromForm(formData) },
    });
    await updateModuleCuration(moduleId, formData);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      redirect("/admin/modules/new?error=duplicate-slug" as Route);
    }
    throw error;
  }

  moduleRevalidationPaths(slug);
  redirect(statusUrl(moduleId, "created"));
}

export async function saveDraftAction(formData: FormData): Promise<void> {
  await requireStaff();
  const moduleId = String(formData.get("moduleId") ?? "");
  const moduleVersionId = String(formData.get("moduleVersionId") ?? "");
  if (!moduleId || !moduleVersionId) redirect("/admin/modules" as Route);

  const mod = await prisma.module.findUnique({ where: { id: moduleId }, select: { slug: true } });
  const parsed = parseDraftBlocksFromForm(formData);
  const parsedSources = sourcesFromForm(formData);
  if (parsed.errors.length > 0 || !parsedSources.ok) redirect(statusUrl(moduleId, "invalid"));

  const service = new ModuleService(prisma);
  try {
    await updateDraftVersionMetadata(moduleVersionId, formData);
    await updateModuleCuration(moduleId, formData);
    const result = await service.setDraftBlocks(moduleVersionId, parsed.blocks);
    if (!result.ok) redirect(statusUrl(moduleId, "invalid"));
    await prisma.moduleVersion.update({
      where: { id: moduleVersionId, status: "DRAFT" },
      data: {
        sources: {
          deleteMany: {},
          create: parsedSources.sources,
        },
      },
    });
  } catch (error) {
    if (error instanceof PublishedVersionImmutableError) redirect(statusUrl(moduleId, "immutable"));
    throw error;
  }

  moduleRevalidationPaths(mod?.slug);
  redirect(statusUrl(moduleId, "saved"));
}

export async function startEditAction(formData: FormData): Promise<void> {
  await requireStaff();
  const moduleId = String(formData.get("moduleId") ?? "");
  if (!moduleId) redirect("/admin/modules" as Route);
  await new ModuleService(prisma).startEdit(moduleId);
  revalidatePath(`/admin/modules/${moduleId}`);
  redirect(statusUrl(moduleId, "started"));
}

export async function publishDraftAction(formData: FormData): Promise<void> {
  await requireStaff();
  const moduleId = String(formData.get("moduleId") ?? "");
  const moduleVersionId = String(formData.get("moduleVersionId") ?? "");
  if (!moduleId || !moduleVersionId) redirect("/admin/modules" as Route);

  const result = await new ModuleService(prisma).publish(moduleVersionId);
  if (!result.ok) redirect(previewStatusUrl(moduleId, "invalid"));

  const mod = await prisma.module.findUnique({ where: { id: moduleId }, select: { slug: true } });
  moduleRevalidationPaths(mod?.slug);
  revalidatePath(`/admin/modules/${moduleId}/preview`);
  redirect(previewStatusUrl(moduleId, "published"));
}

export async function deleteDraftAction(formData: FormData): Promise<void> {
  await requireStaff();
  const moduleId = String(formData.get("moduleId") ?? "");
  const moduleVersionId = String(formData.get("moduleVersionId") ?? "");
  if (!moduleId || !moduleVersionId) redirect("/admin/modules" as Route);

  await prisma.moduleVersion.delete({
    where: { id: moduleVersionId, status: "DRAFT" },
  });

  revalidatePath("/admin/modules");
  revalidatePath(`/admin/modules/${moduleId}`);
  redirect(statusUrl(moduleId, "saved"));
}

export type DraftModuleForEditor = Prisma.ModuleGetPayload<{
  include: {
    versions: {
      include: {
        category: true;
        blocks: true;
        sources: true;
      };
    };
  };
}>;
