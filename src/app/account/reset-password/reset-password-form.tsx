"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { PasswordField } from "../password-field";

export function ResetPasswordForm({ token }: { token: string }) {
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, password: data.get("password") }),
    });
    const result = (await response.json()) as { message?: string; error?: string };
    setPending(false);
    if (!response.ok) {
      setError(result.error ?? "La modification a échoué.");
      return;
    }
    setComplete(true);
  }

  if (complete) {
    return (
      <div className="alert alert--success" role="status">
        <strong>Mot de passe modifié</strong>
        <p>
          Vous pouvez maintenant <Link href="/account/sign-in">vous connecter</Link>.
        </p>
      </div>
    );
  }

  return (
    <form className="form-panel" onSubmit={submit}>
      {error && (
        <div className="alert alert--error" role="alert">
          {error}
        </div>
      )}
      <PasswordField
        id="new-password"
        autoComplete="new-password"
        showRules
        invalid={Boolean(error)}
      />
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Modification…" : "Choisir ce mot de passe"}
      </button>
    </form>
  );
}
