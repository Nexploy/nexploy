/*
  Warnings:

  - You are about to drop the column `environmentId` on the `repository` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "repository" DROP CONSTRAINT "repository_environmentId_fkey";

-- AlterTable
ALTER TABLE "repository" DROP COLUMN "environmentId";
