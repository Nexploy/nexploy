/*
  Warnings:

  - You are about to drop the column `deploymentId` on the `logs` table. All the data in the column will be lost.
  - You are about to drop the `deployment` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `buildId` to the `logs` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BuildStatus" AS ENUM ('QUEUED', 'BUILDING', 'COMPLETED', 'FAILED');

-- DropForeignKey
ALTER TABLE "public"."deployment" DROP CONSTRAINT "deployment_projectId_fkey";

-- DropForeignKey
ALTER TABLE "public"."logs" DROP CONSTRAINT "logs_deploymentId_fkey";

-- AlterTable
ALTER TABLE "logs" DROP COLUMN "deploymentId",
ADD COLUMN     "buildId" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."deployment";

-- DropEnum
DROP TYPE "public"."DeploymentStatus";

-- CreateTable
CREATE TABLE "build" (
    "id" TEXT NOT NULL,
    "status" "BuildStatus" NOT NULL DEFAULT 'QUEUED',
    "commitHash" TEXT,
    "commitMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "build_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "build" ADD CONSTRAINT "build_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs" ADD CONSTRAINT "logs_buildId_fkey" FOREIGN KEY ("buildId") REFERENCES "build"("id") ON DELETE CASCADE ON UPDATE CASCADE;
