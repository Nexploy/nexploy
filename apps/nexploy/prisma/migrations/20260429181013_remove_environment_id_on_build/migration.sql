/*
  Warnings:

  - You are about to drop the column `environmentId` on the `build` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "build" DROP CONSTRAINT "build_environmentId_fkey";

-- AlterTable
ALTER TABLE "build" DROP COLUMN "environmentId";
