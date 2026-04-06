/*
  Warnings:

  - You are about to drop the column `enabled` on the `backup_schedule` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "backup_schedule" DROP COLUMN "enabled";
