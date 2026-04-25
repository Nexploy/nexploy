/*
  Warnings:

  - You are about to drop the column `webhookSecret` on the `git_provider` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "git_provider" DROP COLUMN "webhookSecret";
