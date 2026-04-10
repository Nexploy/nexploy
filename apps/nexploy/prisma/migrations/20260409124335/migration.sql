/*
  Warnings:

  - You are about to drop the column `isDefault` on the `docker_registry` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "docker_registry" DROP COLUMN "isDefault";
