"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function ProfileSettingsForm({
  displayName: initialName,
  leaderboardOptIn: initialOptIn,
}: {
  displayName: string;
  leaderboardOptIn: boolean;
}) {
  const [displayName, setDisplayName] = useState(initialName);
  const [leaderboardOptIn, setLeaderboardOptIn] = useState(initialOptIn);
  const [message, setMessage] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    const response = await fetch("/api/learner/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ displayName, leaderboardOptIn }),
    });
    const result = (await response.json()) as { message?: string; error?: string };
    setPending(false);
    setMessage({
      kind: response.ok ? "success" : "error",
      text: result.message ?? result.error ?? "La modification a échoué.",
    });
    if (response.ok) router.refresh();
  }

  return (
    <form className="form-panel" onSubmit={submit}>
      {message && (
        <div
          className={`alert alert--${message.kind}`}
          role={message.kind === "error" ? "alert" : "status"}
        >
          {message.text}
        </div>
      )}
      <div className="field">
        <label htmlFor="profile-display-name">Pseudonyme</label>
        <p className="field__hint" id="profile-name-hint">
          2 à 40 caractères : lettres, chiffres, espaces, apostrophes, points, tirets ou tirets bas.
        </p>
        <input
          id="profile-display-name"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          minLength={2}
          maxLength={40}
          aria-describedby="profile-name-hint"
          required
        />
      </div>
      <div className="leaderboard-preview" aria-live="polite">
        <p className="eyebrow">Aperçu dans le classement</p>
        <strong>{displayName.trim() || "Votre pseudonyme"}</strong>
        <span>Niveau et points</span>
      </div>
      <label className="toggle-choice">
        <input
          type="checkbox"
          checked={leaderboardOptIn}
          onChange={(event) => setLeaderboardOptIn(event.target.checked)}
        />
        <span>Afficher mon pseudonyme dans le classement public</span>
      </label>
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer mes paramètres"}
      </button>
    </form>
  );
}
