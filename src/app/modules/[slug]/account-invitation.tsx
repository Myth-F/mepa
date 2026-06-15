"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * Non-blocking invitation shown to anonymous visitors inside a module. It never
 * gates access — the module is fully usable — and can be dismissed. Consistent
 * with the learner-experience principle that a visitor can start without an
 * account.
 */
export function AccountInvitation() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <aside className="invitation" aria-label="Suggestion">
      <div>
        <p className="invitation__title">Gardez votre progression</p>
        <p className="invitation__text">
          Créez un espace personnel (gratuit) pour retrouver ce module et vos résultats plus
          tard. Vous pouvez continuer sans compte.
        </p>
      </div>
      <div className="invitation__actions">
        <Link className="btn btn--secondary" href="/account/register">
          Créer mon espace
        </Link>
        <button type="button" className="text-link" onClick={() => setDismissed(true)}>
          Plus tard
        </button>
      </div>
    </aside>
  );
}
