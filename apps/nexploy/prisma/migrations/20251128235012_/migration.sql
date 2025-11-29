/*
  Warnings:

  - You are about to drop the `build` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."build" DROP CONSTRAINT "build_projectId_fkey";

-- DropForeignKey
ALTER TABLE "public"."logs" DROP CONSTRAINT "logs_buildId_fkey";

-- DropTable
DROP TABLE "public"."build";

-- CreateTable
CREATE TABLE "builds" (
    "id" TEXT NOT NULL,
    "status" "BuildStatus" NOT NULL DEFAULT 'QUEUED',
    "commitHash" TEXT,
    "commitMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "builds_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "builds" ADD CONSTRAINT "builds_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs" ADD CONSTRAINT "logs_buildId_fkey" FOREIGN KEY ("buildId") REFERENCES "builds"("id") ON DELETE CASCADE ON UPDATE CASCADE;
