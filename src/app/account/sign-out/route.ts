import { NextResponse, type NextRequest } from "next/server";
import { deleteLearnerSession } from "@/shared/auth/learner-session";

export async function POST(request: NextRequest) {
  await deleteLearnerSession();
  return NextResponse.redirect(new URL("/", request.url), 303);
}
