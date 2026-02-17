/*
  Warnings:

  - The `ownerType` column on the `git_provider` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "git_provider" DROP COLUMN "ownerType",
ADD COLUMN     "ownerType" TEXT;

-- DropEnum
DROP TYPE "public"."OwnerType";
