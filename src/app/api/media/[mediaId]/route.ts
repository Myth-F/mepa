import { NextResponse } from "next/server";
import { getCurrentStaff } from "@/shared/auth/staff-session";
import { prisma } from "@/shared/db/prisma";
import { getMediaStorage } from "@/modules/media/s3-adapter";

export async function GET(_request: Request, { params }: { params: Promise<{ mediaId: string }> }) {
  const { mediaId } = await params;
  const asset = await prisma.mediaAsset.findFirst({
    where: { id: mediaId, uploadedAt: { not: null } },
  });
  if (!asset) return NextResponse.json({ error: "Média introuvable." }, { status: 404 });

  const staff = await getCurrentStaff();
  if (!staff) {
    const publishedReference = await prisma.moduleBlock.findFirst({
      where: {
        type: "image",
        moduleVersion: { status: "PUBLISHED" },
        payload: { path: ["mediaId"], equals: mediaId },
      },
      select: { id: true },
    });
    if (!publishedReference) {
      return NextResponse.json({ error: "Média introuvable." }, { status: 404 });
    }
  }

  const url = await getMediaStorage().createSignedDownload(asset.objectKey, 300);
  const storedResponse = await fetch(url, { cache: "no-store" });
  if (!storedResponse.ok || !storedResponse.body) {
    return NextResponse.json({ error: "Média indisponible." }, { status: 502 });
  }
  return new NextResponse(storedResponse.body, {
    headers: {
      "Content-Type": asset.mimeType,
      "Content-Length": String(asset.sizeBytes),
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
