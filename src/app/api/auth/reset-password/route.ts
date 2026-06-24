import { NextResponse } from "next/server";
import { applyPasswordReset } from "@/modules/identity/password-reset";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    token?: unknown;
    password?: unknown;
  };
  if (typeof body.token !== "string" || typeof body.password !== "string") {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const result = await applyPasswordReset(body.token, body.password);
  if (result === "invalid-password") {
    return NextResponse.json(
      { error: "Le mot de passe ne respecte pas les règles indiquées." },
      { status: 400 },
    );
  }
  if (result === "invalid-token") {
    return NextResponse.json(
      { error: "Ce lien est invalide, expiré ou déjà utilisé." },
      { status: 400 },
    );
  }
  return NextResponse.json({ message: "Votre mot de passe a été modifié." });
}
