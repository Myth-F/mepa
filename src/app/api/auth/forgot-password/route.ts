import { NextResponse } from "next/server";
import { requestPasswordReset } from "@/modules/identity/password-reset";

const GENERIC_MESSAGE =
  "Si un compte correspond à cette adresse, un lien de réinitialisation vient d’être envoyé.";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { email?: unknown };
  if (typeof body.email === "string" && body.email.trim()) {
    try {
      await requestPasswordReset(body.email);
    } catch (error) {
      console.error("Password reset request failed", error);
    }
  }
  return NextResponse.json({ message: GENERIC_MESSAGE });
}
