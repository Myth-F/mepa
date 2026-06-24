import { NextResponse } from "next/server";
import { getCurrentStaff } from "@/shared/auth/staff-session";
import { prisma } from "@/shared/db/prisma";
import { generateObjectKey } from "@/modules/media/validation";
import { mediaUploadInputSchema } from "@/modules/media/upload-input";

const UPLOAD_TTL_SECONDS = 300;

export async function POST(request: Request) {
  const staff = await getCurrentStaff();
  if (!staff) return NextResponse.json({ error: "Authentification requise." }, { status: 401 });

  const parsed = mediaUploadInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Fichier invalide." },
      { status: 400 },
    );
  }

  const objectKey = generateObjectKey(parsed.data.mimeType);
  const uploadExpiresAt = new Date(Date.now() + UPLOAD_TTL_SECONDS * 1_000);
  const asset = await prisma.mediaAsset.create({
    data: {
      objectKey,
      mimeType: parsed.data.mimeType,
      sizeBytes: parsed.data.sizeBytes,
      altText: parsed.data.isDecorative ? null : parsed.data.altText,
      isDecorative: parsed.data.isDecorative,
      uploadedByStaffId: staff.id,
      uploadExpiresAt,
    },
    select: { id: true },
  });

  return NextResponse.json(
    {
      mediaId: asset.id,
      upload: {
        url: `/api/admin/media/uploads/${asset.id}/content`,
        requiredHeaders: { "Content-Type": parsed.data.mimeType },
        expiresInSeconds: UPLOAD_TTL_SECONDS,
      },
    },
    { status: 201 },
  );
}
