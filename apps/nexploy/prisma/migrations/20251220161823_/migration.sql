/*
  Warnings:

  - Made the column `environmentId` on table `repository` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."repository" DROP CONSTRAINT "repository_environmentId_fkey";

-- AlterTable
ALTER TABLE "repository" ALTER COLUMN "environmentId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "repository" ADD CONSTRAINT "repository_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "environment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
