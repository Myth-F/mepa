-- Distinguish pending upload reservations from media whose bytes were verified
-- in object storage. Existing metadata predates the upload workflow and is
-- treated as completed to preserve compatibility.
ALTER TABLE "media_asset"
  ADD COLUMN "uploadedAt" TIMESTAMP(3),
  ADD COLUMN "uploadExpiresAt" TIMESTAMP(3);

UPDATE "media_asset"
SET "uploadedAt" = "createdAt"
WHERE "uploadedAt" IS NULL;

CREATE INDEX "media_asset_uploadedAt_idx" ON "media_asset"("uploadedAt");
