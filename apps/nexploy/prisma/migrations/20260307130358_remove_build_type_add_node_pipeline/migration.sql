/*
  Warnings:

  - You are about to drop the column `buildArgs` on the `repository` table. All the data in the column will be lost.
  - You are about to drop the column `buildType` on the `repository` table. All the data in the column will be lost.
  - You are about to drop the column `contextPath` on the `repository` table. All the data in the column will be lost.
  - You are about to drop the column `dockerComposePath` on the `repository` table. All the data in the column will be lost.
  - You are about to drop the column `dockerfilePath` on the `repository` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "repository" DROP COLUMN "buildArgs",
DROP COLUMN "buildType",
DROP COLUMN "contextPath",
DROP COLUMN "dockerComposePath",
DROP COLUMN "dockerfilePath";

-- DropEnum
DROP TYPE "public"."BuildType";
