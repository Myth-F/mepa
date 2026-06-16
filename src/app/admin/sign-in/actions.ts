"use server";

import { redirect } from "next/navigation";
import { createStaffSession } from "@/shared/auth/staff-session";

export async function signInStaffAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/admin/sign-in?error=missing");
  }

  let signedIn = false;
  try {
    signedIn = await createStaffSession(email, password);
  } catch (error) {
    console.error("Staff sign-in failed with an unexpected error", error);
    redirect("/admin/sign-in?error=server");
  }

  if (!signedIn) {
    redirect("/admin/sign-in?error=invalid");
  }

  redirect("/admin");
}
