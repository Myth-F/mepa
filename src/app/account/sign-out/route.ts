import { deleteLearnerSession } from "@/shared/auth/learner-session";

export async function POST() {
  await deleteLearnerSession();
  return new Response(null, { status: 303, headers: { Location: "/" } });
}
