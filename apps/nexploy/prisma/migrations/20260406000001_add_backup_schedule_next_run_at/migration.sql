-- AlterTable
ALTER TABLE "backup_schedule" ADD COLUMN "nextRunAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();
