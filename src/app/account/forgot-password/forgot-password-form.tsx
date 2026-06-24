"use client";

import { useState, type FormEvent } from "react";

export function ForgotPasswordForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setPending(true);
    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: data.get("email") }),
    });
    const result = (await response.json()) as { message: string };
    setMessage(result.message);
    setPending(false);
  }

  if (message) {
    return (
      <div className="alert alert--success" role="status">
        <strong>Vérifiez votre messagerie</strong>
        <p>{message}</p>
      </div>
    );
  }

  return (
    <form className="form-panel" onSubmit={submit}>
      <div className="field">
        <label htmlFor="reset-email">Adresse e-mail</label>
        <input id="reset-email" name="email" type="email" autoComplete="email" required />
      </div>
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Envoi en cours…" : "Recevoir un lien"}
      </button>
    </form>
  );
}
