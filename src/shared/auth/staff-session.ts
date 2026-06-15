import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/shared/db/prisma";
import { env } from "@/shared/config/env";
import { generateSessionToken, hashSessionToken, verifyPassword } from "@/modules/identity/crypto";

export const STAFF_SESSION_COOKIE = "mepa_staff_session";

export interface CurrentStaff {
  id: string;
  name: string;
  role: "ADMIN" | "EDITOR";
}

export async function getCurrentStaff(): Promise<CurrentStaff | null> {
  const token = (await cookies()).get(STAFF_SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.staffSession.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    include: { staffUser: true },
  });

  if (!session || session.expiresAt <= new Date() || !session.staffUser.active) {
    return null;
  }

  return {
    id: session.staffUser.id,
    name: session.staffUser.name,
    role: session.staffUser.role,
  };
}

export async function requireStaff(): Promise<CurrentStaff> {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/admin/sign-in");
  return staff;
}

export async function requireStaffRole(
  allowedRoles: CurrentStaff["role"][],
): Promise<CurrentStaff> {
  const staff = await requireStaff();
  if (!allowedRoles.includes(staff.role)) redirect("/");
  return staff;
}

export async function createStaffSession(email: string, password: string): Promise<boolean> {
  const staff = await prisma.staffUser.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  if (!staff || !staff.active || !(await verifyPassword(staff.passwordHash, password))) {
    return false;
  }

  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + env.SESSION_TTL_HOURS * 60 * 60 * 1000);

  await prisma.staffSession.create({
    data: {
      staffUserId: staff.id,
      tokenHash: hashSessionToken(token),
      expiresAt,
    },
  });

  (await cookies()).set(STAFF_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
  return true;
}

export async function deleteStaffSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(STAFF_SESSION_COOKIE)?.value;

  if (token) {
    await prisma.staffSession.deleteMany({
      where: { tokenHash: hashSessionToken(token) },
    });
  }

  cookieStore.delete(STAFF_SESSION_COOKIE);
}
