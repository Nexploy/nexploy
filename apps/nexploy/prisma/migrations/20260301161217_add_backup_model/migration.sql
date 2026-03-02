-- CreateEnum
CREATE TYPE "BackupStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "backup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "volumeName" TEXT NOT NULL,
    "size" BIGINT,
    "status" "BackupStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "environmentId" TEXT,

    CONSTRAINT "backup_pkey" PRIMARY KEY ("id")
);
