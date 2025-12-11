/*
  Warnings:

  - The `buildType` column on the `repository` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "BuildType" AS ENUM ('DOCKERFILE', 'DOCKER_COMPOSE', 'NIXPACKS', 'BUILDPACKS');

-- AlterTable
ALTER TABLE "repository" DROP COLUMN "buildType",
ADD COLUMN     "buildType" "BuildType" NOT NULL DEFAULT 'DOCKERFILE';
