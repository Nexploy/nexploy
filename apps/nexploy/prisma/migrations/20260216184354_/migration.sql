/*
  Warnings:

  - Added the required column `displayName` to the `git_provider` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."git_provider_provider_key";

-- AlterTable
ALTER TABLE "git_provider" ADD COLUMN     "displayName" TEXT NOT NULL;
