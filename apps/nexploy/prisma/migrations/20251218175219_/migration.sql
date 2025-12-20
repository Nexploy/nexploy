/*
  Warnings:

  - You are about to drop the column `createdAt` on the `environment` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `environment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "environment" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";
