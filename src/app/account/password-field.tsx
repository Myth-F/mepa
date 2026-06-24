"use client";

import { useState } from "react";
import { passwordChecks } from "@/modules/identity/validation";

export function PasswordField({
  id,
  name = "password",
  label = "Mot de passe",
  autoComplete,
  describedBy,
  invalid,
  showRules = false,
}: {
  id: string;
  name?: string;
  label?: string;
  autoComplete: "current-password" | "new-password";
  describedBy?: string;
  invalid?: boolean;
  showRules?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const [value, setValue] = useState("");
  const checks = passwordChecks(value);
  const rulesId = `${id}-rules`;

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="password-input">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          autoComplete={autoComplete}
          minLength={showRules ? 12 : undefined}
          aria-invalid={invalid ? true : undefined}
          aria-describedby={
            [showRules ? rulesId : null, describedBy].filter(Boolean).join(" ") || undefined
          }
          required
        />
        <button
          className="password-input__toggle"
          type="button"
          aria-controls={id}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? "Masquer" : "Afficher"}
        </button>
      </div>
      {showRules && (
        <div id={rulesId} className="password-rules" aria-live="polite">
          <p className="field__hint">Votre mot de passe doit contenir :</p>
          <ul>
            <li data-valid={checks.longEnough}>au moins 12 caractères ;</li>
            <li data-valid={checks.hasLetter}>au moins une lettre ;</li>
            <li data-valid={checks.hasNumberOrSymbol}>au moins un chiffre ou un symbole.</li>
          </ul>
        </div>
      )}
    </div>
  );
}
