/*
  Warnings:

  - You are about to drop the column `domain` on the `repository` table. All the data in the column will be lost.
  - You are about to drop the column `traefikEnabled` on the `repository` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "repository" DROP COLUMN "domain",
DROP COLUMN "traefikEnabled";
