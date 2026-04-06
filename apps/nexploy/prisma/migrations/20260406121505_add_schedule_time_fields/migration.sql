-- AlterTable
ALTER TABLE "backup_schedule" ADD COLUMN     "scheduledDay" INTEGER,
ADD COLUMN     "scheduledHour" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "scheduledMinute" INTEGER NOT NULL DEFAULT 0;
