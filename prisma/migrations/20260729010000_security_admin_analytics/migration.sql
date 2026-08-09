CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

ALTER TABLE "User"
ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'USER',
ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Resume"
ADD COLUMN "paperSize" TEXT NOT NULL DEFAULT 'A4',
ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "archivedAt" TIMESTAMP(3);

ALTER TABLE "ResumeEvent"
ADD COLUMN "visitorHash" TEXT,
ADD COLUMN "dayKey" TEXT;

UPDATE "ResumeEvent"
SET "dayKey" = to_char("createdAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD')
WHERE "dayKey" IS NULL;

ALTER TABLE "ResumeEvent" ALTER COLUMN "dayKey" SET NOT NULL;

CREATE INDEX "Resume_userId_archivedAt_updatedAt_idx" ON "Resume"("userId", "archivedAt", "updatedAt");
CREATE INDEX "ResumeEvent_resumeId_dayKey_type_idx" ON "ResumeEvent"("resumeId", "dayKey", "type");
CREATE UNIQUE INDEX "ResumeEvent_resumeId_type_visitorHash_dayKey_key" ON "ResumeEvent"("resumeId", "type", "visitorHash", "dayKey");
