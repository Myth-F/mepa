import { NextResponse } from "next/server";
import { getCurrentLearner } from "@/shared/auth/learner-session";
import { prisma } from "@/shared/db/prisma";
import { displayNameError, normalizeDisplayName } from "@/modules/identity/validation";

export async function PATCH(request: Request) {
  const learner = await getCurrentLearner();
  if (!learner) return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as {
    displayName?: unknown;
    leaderboardOptIn?: unknown;
  };
  if (typeof body.displayName !== "string" || typeof body.leaderboardOptIn !== "boolean") {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
  const displayName = normalizeDisplayName(body.displayName);
  const validationError = displayNameError(displayName);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  const duplicate = await prisma.learner.findFirst({
    where: { id: { not: learner.id }, displayName: { equals: displayName, mode: "insensitive" } },
    select: { id: true },
  });
  if (duplicate)
    return NextResponse.json({ error: "Ce pseudonyme est déjà utilisé." }, { status: 409 });

  try {
    await prisma.$transaction([
      prisma.learner.update({ where: { id: learner.id }, data: { displayName } }),
      prisma.learnerScore.upsert({
        where: { learnerId: learner.id },
        create: { learnerId: learner.id, leaderboardOptIn: body.leaderboardOptIn },
        update: { leaderboardOptIn: body.leaderboardOptIn },
      }),
    ]);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json({ error: "Ce pseudonyme est déjà utilisé." }, { status: 409 });
    }
    throw error;
  }
  return NextResponse.json({ message: "Vos paramètres ont été enregistrés.", displayName });
}
