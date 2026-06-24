"use client";

export function DeleteAccountButton() {
  return (
    <button
      className="btn btn--danger"
      type="submit"
      onClick={(event) => {
        if (
          !window.confirm(
            "Supprimer définitivement votre compte, votre progression et vos points ? Cette action est irréversible.",
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      Supprimer mon espace
    </button>
  );
}
