-- CreateEnum
CREATE TYPE "ActivitySource" AS ENUM ('SERVER_ACTION', 'API_ROUTE');

-- CreateEnum
CREATE TYPE "ActivityStatus" AS ENUM ('SUCCESS', 'FAILURE', 'DENIED');

-- CreateEnum
CREATE TYPE "ActivityActorType" AS ENUM ('USER', 'API_KEY', 'SYSTEM');

-- CreateTable
CREATE TABLE "activity_log" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "source" "ActivitySource" NOT NULL,
    "status" "ActivityStatus" NOT NULL,
    "resource" TEXT,
    "action" TEXT,
    "actorType" "ActivityActorType" NOT NULL DEFAULT 'USER',
    "actorId" TEXT,
    "actorEmail" TEXT,
    "actorRole" TEXT,
    "organizationId" TEXT,
    "targetType" TEXT,
    "targetId" TEXT,
    "targetName" TEXT,
    "environmentId" TEXT,
    "durationMs" INTEGER,
    "errorMessage" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "requestId" TEXT,
    "metadata" JSONB,

    CONSTRAINT "activity_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_settings" (
    "id" TEXT NOT NULL,
    "singleton" TEXT NOT NULL DEFAULT 'default',
    "retentionDays" INTEGER NOT NULL DEFAULT 90,
    "lastPurgeAt" TIMESTAMP(3),
    "lastPurgeCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "activity_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activity_log_createdAt_idx" ON "activity_log"("createdAt");

-- CreateIndex
CREATE INDEX "activity_log_actorId_createdAt_idx" ON "activity_log"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "activity_log_name_createdAt_idx" ON "activity_log"("name", "createdAt");

-- CreateIndex
CREATE INDEX "activity_log_status_createdAt_idx" ON "activity_log"("status", "createdAt");

-- CreateIndex
CREATE INDEX "activity_log_targetType_targetId_idx" ON "activity_log"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "activity_log_organizationId_createdAt_idx" ON "activity_log"("organizationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "activity_settings_singleton_key" ON "activity_settings"("singleton");

-- AddForeignKey
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
