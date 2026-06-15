CREATE TYPE "PointEventKind" AS ENUM ('MODULE_COMPLETED', 'QUIZ_PASSED', 'QUIZ_FIRST_TRY_BONUS', 'DILEMMA_VOTED');

CREATE TABLE "point_event" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "moduleVersionId" TEXT NOT NULL,
    "kind" "PointEventKind" NOT NULL,
    "sourceId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "ruleVersion" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "point_event_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "learner_score" (
    "learnerId" TEXT NOT NULL,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "firstReachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leaderboardOptIn" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "learner_score_pkey" PRIMARY KEY ("learnerId")
);

CREATE UNIQUE INDEX "point_event_learnerId_kind_sourceId_key" ON "point_event"("learnerId", "kind", "sourceId");
CREATE INDEX "point_event_learnerId_createdAt_idx" ON "point_event"("learnerId", "createdAt");
CREATE INDEX "point_event_moduleVersionId_idx" ON "point_event"("moduleVersionId");
CREATE INDEX "learner_score_leaderboardOptIn_totalPoints_firstReachedAt_idx" ON "learner_score"("leaderboardOptIn", "totalPoints", "firstReachedAt");

ALTER TABLE "point_event" ADD CONSTRAINT "point_event_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "learner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "point_event" ADD CONSTRAINT "point_event_moduleVersionId_fkey" FOREIGN KEY ("moduleVersionId") REFERENCES "module_version"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "learner_score" ADD CONSTRAINT "learner_score_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "learner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
