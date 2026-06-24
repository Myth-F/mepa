-- Password reset tokens are stored as SHA-256 hashes and expire after 15 minutes
-- at the application layer. The expiresAt index supports scheduled cleanup.
CREATE TABLE "password_reset_token" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "password_reset_token_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "password_reset_token_tokenHash_key" ON "password_reset_token"("tokenHash");
CREATE INDEX "password_reset_token_learnerId_idx" ON "password_reset_token"("learnerId");
CREATE INDEX "password_reset_token_expiresAt_idx" ON "password_reset_token"("expiresAt");

ALTER TABLE "password_reset_token"
  ADD CONSTRAINT "password_reset_token_learnerId_fkey"
  FOREIGN KEY ("learnerId") REFERENCES "learner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TYPE "UsernameReportStatus" AS ENUM ('PENDING', 'DISMISSED', 'ACTIONED');

CREATE TABLE "username_report" (
    "id" TEXT NOT NULL,
    "reporterLearnerId" TEXT NOT NULL,
    "subjectLearnerId" TEXT,
    "reportedName" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "UsernameReportStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedByStaffId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "username_report_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "username_report_status_createdAt_idx" ON "username_report"("status", "createdAt");
CREATE INDEX "username_report_subjectLearnerId_idx" ON "username_report"("subjectLearnerId");

ALTER TABLE "username_report"
  ADD CONSTRAINT "username_report_reporterLearnerId_fkey"
  FOREIGN KEY ("reporterLearnerId") REFERENCES "learner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "username_report"
  ADD CONSTRAINT "username_report_subjectLearnerId_fkey"
  FOREIGN KEY ("subjectLearnerId") REFERENCES "learner"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "username_report"
  ADD CONSTRAINT "username_report_reviewedByStaffId_fkey"
  FOREIGN KEY ("reviewedByStaffId") REFERENCES "staff_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Remove known throwaway leaderboard entries without deleting learning data.
UPDATE "learner_score" AS score
SET "leaderboardOptIn" = false
FROM "learner" AS learner
WHERE learner.id = score."learnerId"
  AND lower(learner."displayName") IN ('fkfdnfnsdof', 'sossouille_test');

-- Keep existing accounts while making public pseudonyms unambiguous. In the
-- unlikely event of duplicates, preserve the oldest and suffix later records.
WITH duplicates AS (
  SELECT id, "displayName",
         row_number() OVER (PARTITION BY lower("displayName") ORDER BY "createdAt", id) AS position
  FROM "learner"
)
UPDATE "learner" AS learner
SET "displayName" = left(duplicates."displayName", 31) || '-' || left(learner.id, 8)
FROM duplicates
WHERE learner.id = duplicates.id AND duplicates.position > 1;

CREATE UNIQUE INDEX "learner_displayName_key" ON "learner"("displayName");
