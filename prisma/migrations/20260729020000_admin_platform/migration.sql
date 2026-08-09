CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED');
CREATE TYPE "AuditCategory" AS ENUM ('AUTH', 'USER', 'RESUME', 'SETTINGS', 'SECURITY', 'SUPPORT', 'SYSTEM');
CREATE TYPE "AuditSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED');
CREATE TYPE "SupportTicketType" AS ENUM ('FEEDBACK', 'CONTACT', 'ACCOUNT_RECOVERY', 'TECHNICAL_ERROR', 'ABUSE_REPORT');
CREATE TYPE "SupportTicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_ON_USER', 'RESOLVED', 'CLOSED');
CREATE TYPE "SupportPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

ALTER TABLE "User" ADD COLUMN "authProvider" TEXT NOT NULL DEFAULT 'email',
ADD COLUMN "deletedAt" TIMESTAMP(3),
ADD COLUMN "emailVerifiedAt" TIMESTAMP(3),
ADD COLUMN "lastActiveAt" TIMESTAMP(3),
ADD COLUMN "lastLoginAt" TIMESTAMP(3),
ADD COLUMN "sessionsRevokedAt" TIMESTAMP(3),
ADD COLUMN "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN "suspendedAt" TIMESTAMP(3);

ALTER TABLE "Resume" ADD COLUMN "moderationHiddenAt" TIMESTAMP(3),
ADD COLUMN "moderationReason" TEXT;

CREATE TABLE "ResumeReport" (
  "id" TEXT NOT NULL, "resumeId" TEXT NOT NULL, "reason" TEXT NOT NULL,
  "details" TEXT, "reporterHash" TEXT, "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ResumeReport_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ResumeModerationAction" (
  "id" TEXT NOT NULL, "resumeId" TEXT NOT NULL, "actorId" TEXT, "action" TEXT NOT NULL,
  "reason" TEXT, "metadata" JSONB, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ResumeModerationAction_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "AdminAuditLog" (
  "id" TEXT NOT NULL, "actorId" TEXT, "category" "AuditCategory" NOT NULL,
  "severity" "AuditSeverity" NOT NULL DEFAULT 'INFO', "action" TEXT NOT NULL,
  "targetType" TEXT, "targetId" TEXT, "summary" TEXT NOT NULL, "metadata" JSONB,
  "ipHash" TEXT, "userAgent" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SecurityEvent" (
  "id" TEXT NOT NULL, "userId" TEXT, "type" TEXT NOT NULL,
  "severity" "AuditSeverity" NOT NULL DEFAULT 'INFO', "description" TEXT NOT NULL,
  "ipHash" TEXT, "metadata" JSONB, "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SecurityEvent_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SystemSetting" (
  "id" TEXT NOT NULL, "key" TEXT NOT NULL, "value" JSONB NOT NULL, "description" TEXT,
  "updatedById" TEXT, "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "TemplateConfiguration" (
  "id" TEXT NOT NULL, "key" TEXT NOT NULL, "name" TEXT NOT NULL, "description" TEXT,
  "enabled" BOOLEAN NOT NULL DEFAULT true, "position" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "TemplateConfiguration_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SupportTicket" (
  "id" TEXT NOT NULL, "requesterId" TEXT, "assignedToId" TEXT, "email" TEXT NOT NULL,
  "subject" TEXT NOT NULL, "type" "SupportTicketType" NOT NULL,
  "status" "SupportTicketStatus" NOT NULL DEFAULT 'OPEN',
  "priority" "SupportPriority" NOT NULL DEFAULT 'NORMAL',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  "resolvedAt" TIMESTAMP(3), CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SupportMessage" (
  "id" TEXT NOT NULL, "ticketId" TEXT NOT NULL, "authorId" TEXT, "body" TEXT NOT NULL,
  "isInternal" BOOLEAN NOT NULL DEFAULT false, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SupportMessage_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Faq" (
  "id" TEXT NOT NULL, "question" TEXT NOT NULL, "answer" TEXT NOT NULL, "category" TEXT NOT NULL,
  "published" BOOLEAN NOT NULL DEFAULT true, "position" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Faq_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Announcement" (
  "id" TEXT NOT NULL, "authorId" TEXT, "title" TEXT NOT NULL, "message" TEXT NOT NULL,
  "kind" TEXT NOT NULL DEFAULT 'info', "active" BOOLEAN NOT NULL DEFAULT true,
  "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "endsAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ResumeReport_status_createdAt_idx" ON "ResumeReport"("status", "createdAt");
CREATE INDEX "ResumeReport_resumeId_status_idx" ON "ResumeReport"("resumeId", "status");
CREATE INDEX "ResumeModerationAction_resumeId_createdAt_idx" ON "ResumeModerationAction"("resumeId", "createdAt");
CREATE INDEX "ResumeModerationAction_actorId_createdAt_idx" ON "ResumeModerationAction"("actorId", "createdAt");
CREATE INDEX "AdminAuditLog_createdAt_idx" ON "AdminAuditLog"("createdAt");
CREATE INDEX "AdminAuditLog_category_createdAt_idx" ON "AdminAuditLog"("category", "createdAt");
CREATE INDEX "AdminAuditLog_actorId_createdAt_idx" ON "AdminAuditLog"("actorId", "createdAt");
CREATE INDEX "AdminAuditLog_targetType_targetId_createdAt_idx" ON "AdminAuditLog"("targetType", "targetId", "createdAt");
CREATE INDEX "SecurityEvent_type_createdAt_idx" ON "SecurityEvent"("type", "createdAt");
CREATE INDEX "SecurityEvent_severity_resolvedAt_createdAt_idx" ON "SecurityEvent"("severity", "resolvedAt", "createdAt");
CREATE INDEX "SecurityEvent_userId_createdAt_idx" ON "SecurityEvent"("userId", "createdAt");
CREATE UNIQUE INDEX "SystemSetting_key_key" ON "SystemSetting"("key");
CREATE INDEX "SystemSetting_updatedAt_idx" ON "SystemSetting"("updatedAt");
CREATE UNIQUE INDEX "TemplateConfiguration_key_key" ON "TemplateConfiguration"("key");
CREATE INDEX "TemplateConfiguration_enabled_position_idx" ON "TemplateConfiguration"("enabled", "position");
CREATE INDEX "SupportTicket_status_priority_updatedAt_idx" ON "SupportTicket"("status", "priority", "updatedAt");
CREATE INDEX "SupportTicket_type_createdAt_idx" ON "SupportTicket"("type", "createdAt");
CREATE INDEX "SupportTicket_requesterId_createdAt_idx" ON "SupportTicket"("requesterId", "createdAt");
CREATE INDEX "SupportTicket_assignedToId_status_idx" ON "SupportTicket"("assignedToId", "status");
CREATE INDEX "SupportMessage_ticketId_createdAt_idx" ON "SupportMessage"("ticketId", "createdAt");
CREATE INDEX "Faq_published_position_idx" ON "Faq"("published", "position");
CREATE INDEX "Faq_category_position_idx" ON "Faq"("category", "position");
CREATE INDEX "Announcement_active_startsAt_endsAt_idx" ON "Announcement"("active", "startsAt", "endsAt");
CREATE INDEX "User_status_createdAt_idx" ON "User"("status", "createdAt");
CREATE INDEX "User_role_status_idx" ON "User"("role", "status");
CREATE INDEX "User_lastActiveAt_idx" ON "User"("lastActiveAt");
CREATE INDEX "Resume_moderationHiddenAt_updatedAt_idx" ON "Resume"("moderationHiddenAt", "updatedAt");

ALTER TABLE "ResumeReport" ADD CONSTRAINT "ResumeReport_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ResumeModerationAction" ADD CONSTRAINT "ResumeModerationAction_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ResumeModerationAction" ADD CONSTRAINT "ResumeModerationAction_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SecurityEvent" ADD CONSTRAINT "SecurityEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SystemSetting" ADD CONSTRAINT "SystemSetting_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
