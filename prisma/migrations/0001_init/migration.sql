-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('ADMIN', 'EDITOR');

-- CreateEnum
CREATE TYPE "ModuleStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "learner" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "learner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learner_session" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learner_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_user" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "StaffRole" NOT NULL DEFAULT 'EDITOR',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_session" (
    "id" TEXT NOT NULL,
    "staffUserId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "module" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdByStaffId" TEXT,

    CONSTRAINT "module_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "module_version" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "status" "ModuleStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL DEFAULT '',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "module_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "module_block" (
    "id" TEXT NOT NULL,
    "moduleVersionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "schemaVersion" INTEGER NOT NULL DEFAULT 1,
    "position" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,

    CONSTRAINT "module_block_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "module_source" (
    "id" TEXT NOT NULL,
    "moduleVersionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT,
    "citation" TEXT,

    CONSTRAINT "module_source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_asset" (
    "id" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "altText" TEXT,
    "isDecorative" BOOLEAN NOT NULL DEFAULT false,
    "uploadedByStaffId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "module_completion" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "moduleVersionId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "module_completion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_attempt" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "moduleVersionId" TEXT NOT NULL,
    "blockId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "maxScore" INTEGER NOT NULL,
    "answers" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quiz_attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dilemma_vote" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "moduleVersionId" TEXT NOT NULL,
    "blockId" TEXT NOT NULL,
    "choice" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dilemma_vote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "learner_email_key" ON "learner"("email");

-- CreateIndex
CREATE UNIQUE INDEX "learner_session_tokenHash_key" ON "learner_session"("tokenHash");

-- CreateIndex
CREATE INDEX "learner_session_learnerId_idx" ON "learner_session"("learnerId");

-- CreateIndex
CREATE UNIQUE INDEX "staff_user_email_key" ON "staff_user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "staff_session_tokenHash_key" ON "staff_session"("tokenHash");

-- CreateIndex
CREATE INDEX "staff_session_staffUserId_idx" ON "staff_session"("staffUserId");

-- CreateIndex
CREATE UNIQUE INDEX "module_slug_key" ON "module"("slug");

-- CreateIndex
CREATE INDEX "module_version_status_idx" ON "module_version"("status");

-- CreateIndex
CREATE UNIQUE INDEX "module_version_moduleId_versionNumber_key" ON "module_version"("moduleId", "versionNumber");

-- CreateIndex
CREATE INDEX "module_block_moduleVersionId_idx" ON "module_block"("moduleVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "module_block_moduleVersionId_position_key" ON "module_block"("moduleVersionId", "position");

-- CreateIndex
CREATE INDEX "module_source_moduleVersionId_idx" ON "module_source"("moduleVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "media_asset_objectKey_key" ON "media_asset"("objectKey");

-- CreateIndex
CREATE UNIQUE INDEX "module_completion_learnerId_moduleVersionId_key" ON "module_completion"("learnerId", "moduleVersionId");

-- CreateIndex
CREATE INDEX "quiz_attempt_learnerId_idx" ON "quiz_attempt"("learnerId");

-- CreateIndex
CREATE INDEX "quiz_attempt_moduleVersionId_idx" ON "quiz_attempt"("moduleVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "dilemma_vote_learnerId_blockId_key" ON "dilemma_vote"("learnerId", "blockId");

-- AddForeignKey
ALTER TABLE "learner_session" ADD CONSTRAINT "learner_session_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "learner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_session" ADD CONSTRAINT "staff_session_staffUserId_fkey" FOREIGN KEY ("staffUserId") REFERENCES "staff_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module" ADD CONSTRAINT "module_createdByStaffId_fkey" FOREIGN KEY ("createdByStaffId") REFERENCES "staff_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_version" ADD CONSTRAINT "module_version_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_block" ADD CONSTRAINT "module_block_moduleVersionId_fkey" FOREIGN KEY ("moduleVersionId") REFERENCES "module_version"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_source" ADD CONSTRAINT "module_source_moduleVersionId_fkey" FOREIGN KEY ("moduleVersionId") REFERENCES "module_version"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_asset" ADD CONSTRAINT "media_asset_uploadedByStaffId_fkey" FOREIGN KEY ("uploadedByStaffId") REFERENCES "staff_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_completion" ADD CONSTRAINT "module_completion_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "learner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_completion" ADD CONSTRAINT "module_completion_moduleVersionId_fkey" FOREIGN KEY ("moduleVersionId") REFERENCES "module_version"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempt" ADD CONSTRAINT "quiz_attempt_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "learner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempt" ADD CONSTRAINT "quiz_attempt_moduleVersionId_fkey" FOREIGN KEY ("moduleVersionId") REFERENCES "module_version"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempt" ADD CONSTRAINT "quiz_attempt_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "module_block"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dilemma_vote" ADD CONSTRAINT "dilemma_vote_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "learner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dilemma_vote" ADD CONSTRAINT "dilemma_vote_moduleVersionId_fkey" FOREIGN KEY ("moduleVersionId") REFERENCES "module_version"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dilemma_vote" ADD CONSTRAINT "dilemma_vote_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "module_block"("id") ON DELETE CASCADE ON UPDATE CASCADE;
