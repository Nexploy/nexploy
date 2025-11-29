/*
  Warnings:

  - The `status` column on the `deployment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `level` column on the `logs` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "LogsLevel" AS ENUM ('INFO', 'WARN', 'ERROR', 'DEBUG');

-- CreateEnum
CREATE TYPE "DeploymentStatus" AS ENUM ('QUEUED', 'BUILDING', 'FINISH');

-- AlterTable
ALTER TABLE "deployment" DROP COLUMN "status",
ADD COLUMN     "status" "DeploymentStatus" NOT NULL DEFAULT 'QUEUED';

-- AlterTable
ALTER TABLE "logs" DROP COLUMN "level",
ADD COLUMN     "level" "LogsLevel" NOT NULL DEFAULT 'INFO';
