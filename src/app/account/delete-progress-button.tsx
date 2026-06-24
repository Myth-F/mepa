"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteProgressButton() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  async function remove() {
    if (!window.confirm("Supprimer définitivement votre progression et vos points ?")) return;
    setPending(true);
    const response = await fetch("/api/learner/progress", { method: "DELETE" });
    const result = (await response.json()) as { message?: string; error?: string };
    setMessage(result.message ?? result.error ?? "La suppression a échoué.");
    setPending(false);
    router.refresh();
  }
  return (
    <>
      <button className="btn btn--danger" type="button" onClick={remove} disabled={pending}>
        {pending ? "Suppression…" : "Supprimer ma progression"}
      </button>
      {message && <p role="status">{message}</p>}
    </>
  );
}
