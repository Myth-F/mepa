import { deleteStaffSession } from "@/shared/auth/staff-session";

export async function POST() {
  await deleteStaffSession();
  return new Response(null, { status: 303, headers: { Location: "/" } });
}
