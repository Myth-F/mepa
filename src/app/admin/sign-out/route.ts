import { NextResponse, type NextRequest } from "next/server";
import { deleteStaffSession } from "@/shared/auth/staff-session";

export async function POST(request: NextRequest) {
  await deleteStaffSession();
  return NextResponse.redirect(new URL("/", request.url), 303);
}
