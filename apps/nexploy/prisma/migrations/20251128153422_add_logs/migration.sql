/*
  Warnings:

  - You are about to drop the column `buildLogs` on the `deployment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "deployment" DROP COLUMN "buildLogs";

-- CreateTable
CREATE TABLE "logs" (
    "id" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'info',
    "step" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deploymentId" TEXT NOT NULL,

    CONSTRAINT "logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "logs" ADD CONSTRAINT "logs_deploymentId_fkey" FOREIGN KEY ("deploymentId") REFERENCES "deployment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
