/*
  Warnings:

  - You are about to drop the column `completedNodes` on the `build` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "build" DROP COLUMN "completedNodes",
ADD COLUMN     "nodeStatuses" JSONB NOT NULL DEFAULT '{}';
