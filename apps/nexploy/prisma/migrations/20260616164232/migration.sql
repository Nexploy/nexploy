/*
  Warnings:

  - A unique constraint covering the columns `[environmentId]` on the table `cleanup_settings` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "cleanup_settings" ADD COLUMN     "environmentId" TEXT NOT NULL DEFAULT 'default',
ALTER COLUMN "id" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "cleanup_settings_environmentId_key" ON "cleanup_settings"("environmentId");
