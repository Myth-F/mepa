"use client";

import { useState } from "react";

type UploadPreparation = {
  mediaId: string;
  upload: { url: string; requiredHeaders: Record<string, string> };
};

export function MediaUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [altText, setAltText] = useState("");
  const [isDecorative, setIsDecorative] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [mediaId, setMediaId] = useState<string | null>(null);

  async function upload() {
    if (!file) {
      setMessage("Choisissez d’abord un fichier.");
      return;
    }
    setPending(true);
    setMessage(null);
    setMediaId(null);
    try {
      const prepareResponse = await fetch("/api/admin/media/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mimeType: file.type,
          sizeBytes: file.size,
          altText,
          isDecorative,
        }),
      });
      const preparation = (await prepareResponse.json()) as UploadPreparation & { error?: string };
      if (!prepareResponse.ok) throw new Error(preparation.error ?? "Envoi impossible.");

      const uploadResponse = await fetch(preparation.upload.url, {
        method: "PUT",
        headers: preparation.upload.requiredHeaders,
        body: file,
      });
      const result = (await uploadResponse.json()) as { error?: string };
      if (!uploadResponse.ok) throw new Error(result.error ?? "Envoi impossible.");

      setMediaId(preparation.mediaId);
      setMessage("Image prête. Copiez son identifiant dans un bloc image.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Envoi impossible.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="form-panel" aria-labelledby="media-upload-heading">
      <div className="section-heading">
        <p className="eyebrow">Médiathèque</p>
        <h2 id="media-upload-heading">Ajouter une image</h2>
        <p>Formats PNG, JPEG, WebP, AVIF ou GIF, jusqu’à 10 Mo.</p>
      </div>
      <div className="field">
        <label htmlFor="media-file">Fichier image</label>
        <input
          id="media-file"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
      </div>
      <label className="toggle-choice">
        <input
          type="checkbox"
          checked={isDecorative}
          onChange={(event) => setIsDecorative(event.target.checked)}
        />
        <span>Cette image est uniquement décorative</span>
      </label>
      {!isDecorative && (
        <div className="field">
          <label htmlFor="media-alt">Description de l’image</label>
          <p className="field__hint">
            Décrivez l’information utile, sans commencer par « image de ».
          </p>
          <input
            id="media-alt"
            value={altText}
            onChange={(event) => setAltText(event.target.value)}
            maxLength={500}
          />
        </div>
      )}
      <button className="btn btn--secondary" type="button" onClick={upload} disabled={pending}>
        {pending ? "Envoi en cours…" : "Envoyer l’image"}
      </button>
      {message && (
        <div className={`alert ${mediaId ? "alert--success" : "alert--error"}`} role="status">
          <p>{message}</p>
          {mediaId && (
            <p>
              Identifiant média : <code>{mediaId}</code>
            </p>
          )}
        </div>
      )}
    </section>
  );
}
