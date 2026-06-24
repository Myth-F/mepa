import { NextResponse } from "next/server";
import { getCurrentLearner } from "@/shared/auth/learner-session";
import { prisma } from "@/shared/db/prisma";
import {
  ModuleCompletionRequirementError,
  recordModuleCompletion,
} from "@/modules/learning/record-actions";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ moduleVersionId: string }> },
) {
  const learner = await getCurrentLearner();
  if (!learner) return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  try {
    const { moduleVersionId } = await params;
    const result = await recordModuleCompletion(prisma, {
      learnerId: learner.id,
      moduleVersionId,
    });
    return NextResponse.json({ message: "Module terminé.", points: result.awarded });
  } catch (error) {
    if (error instanceof ModuleCompletionRequirementError) {
      return NextResponse.json(
        {
          error: error.message,
          missingQuizCount: error.missingQuizCount,
          missingDilemmaCount: error.missingDilemmaCount,
        },
        { status: 422 },
      );
    }
    throw error;
  }
}
