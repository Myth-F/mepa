import { NextResponse } from "next/server";
import { getCurrentLearner } from "@/shared/auth/learner-session";
import { prisma } from "@/shared/db/prisma";
import { getLearnerProgress } from "@/modules/learning/progress";

export async function GET() {
  const learner = await getCurrentLearner();
  if (!learner) return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  const progress = await getLearnerProgress(prisma, learner.id);
  return new NextResponse(
    JSON.stringify({ exportedAt: new Date().toISOString(), progress }, null, 2),
    {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": 'attachment; filename="progression-mepa.json"',
      },
    },
  );
}
