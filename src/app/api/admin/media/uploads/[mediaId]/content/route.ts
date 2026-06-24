import { NextResponse } from "next/server";
import { getCurrentStaff } from "@/shared/auth/staff-session";
import { prisma } from "@/shared/db/prisma";
import { getMediaStorage } from "@/modules/media/s3-adapter";

export async function PUT(request: Request, { params }: { params: Promise<{ mediaId: string }> }) {
  const staff = await getCurrentStaff();
  if (!staff) return NextResponse.json({ error: "Authentification requise." }, { status: 401 });

  const { mediaId } = await params;
  const asset = await prisma.mediaAsset.findFirst({
    where: { id: mediaId, uploadedByStaffId: staff.id, uploadedAt: null },
  });
  if (!asset || !asset.uploadExpiresAt || asset.uploadExpiresAt <= new Date()) {
    return NextResponse.json({ error: "Cette demande d’envoi a expiré." }, { status: 410 });
  }
  if (request.headers.get("content-type") !== asset.mimeType) {
    return NextResponse.json({ error: "Le type du fichier a changé." }, { status: 400 });
  }

  const bytes = await request.arrayBuffer();
  if (bytes.byteLength !== asset.sizeBytes) {
    return NextResponse.json({ error: "La taille du fichier a changé." }, { status: 400 });
  }

  const storage = getMediaStorage();
  const signed = await storage.createSignedUpload({
    objectKey: asset.objectKey,
    mimeType: asset.mimeType,
    maxSizeBytes: asset.sizeBytes,
  });
  const uploadResponse = await fetch(signed.url, {
    method: "PUT",
    headers: signed.requiredHeaders,
    body: bytes,
  });
  if (!uploadResponse.ok) {
    return NextResponse.json({ error: "Le stockage a refusé le fichier." }, { status: 502 });
  }

  const stored = await storage.inspectObject(asset.objectKey);
  if (!stored || stored.sizeBytes !== asset.sizeBytes || stored.mimeType !== asset.mimeType) {
    await storage.deleteObject(asset.objectKey).catch(() => undefined);
    return NextResponse.json(
      { error: "Le fichier stocké ne correspond pas à l’envoi." },
      { status: 422 },
    );
  }

  await prisma.mediaAsset.update({
    where: { id: asset.id },
    data: { uploadedAt: new Date(), uploadExpiresAt: null },
  });
  return NextResponse.json({ mediaId: asset.id, message: "Fichier envoyé." });
}
