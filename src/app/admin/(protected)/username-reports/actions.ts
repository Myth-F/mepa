"use server";

import { revalidatePath } from "next/cache";
import { requireStaffRole } from "@/shared/auth/staff-session";
import { prisma } from "@/shared/db/prisma";

export async function reviewUsernameReportAction(formData: FormData): Promise<void> {
  const staff = await requireStaffRole(["ADMIN"]);
  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (!id || (decision !== "DISMISSED" && decision !== "ACTIONED")) return;
  const report = await prisma.usernameReport.update({
    where: { id },
    data: { status: decision, reviewedByStaffId: staff.id, reviewedAt: new Date() },
    select: { subjectLearnerId: true },
  });
  if (decision === "ACTIONED" && report.subjectLearnerId) {
    await prisma.learnerScore.updateMany({
      where: { learnerId: report.subjectLearnerId },
      data: { leaderboardOptIn: false },
    });
  }
  revalidatePath("/admin/username-reports");
  revalidatePath("/leaderboard");
}
