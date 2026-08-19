-- CreateTable
CREATE TABLE "disk_guard_settings" (
    "id" TEXT NOT NULL,
    "environmentId" TEXT NOT NULL DEFAULT 'default',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "warnPercent" INTEGER NOT NULL DEFAULT 80,
    "blockPercent" INTEGER NOT NULL DEFAULT 90,
    "minFreeMb" INTEGER NOT NULL DEFAULT 2048,
    "lastAlertAt" TIMESTAMP(3),
    "lastAlertLevel" TEXT,

    CONSTRAINT "disk_guard_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "disk_guard_settings_environmentId_key" ON "disk_guard_settings"("environmentId");

-- AlterEnum
ALTER TYPE "ActivitySource" ADD VALUE 'SYSTEM';
