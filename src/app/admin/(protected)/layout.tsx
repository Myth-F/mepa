import { requireStaffRole } from "@/shared/auth/staff-session";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  await requireStaffRole(["ADMIN", "EDITOR"]);
  return children;
}
