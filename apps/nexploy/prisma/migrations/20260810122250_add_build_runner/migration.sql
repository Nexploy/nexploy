-- CreateEnum
CREATE TYPE "BuildRunnerStatus" AS ENUM ('OFFLINE', 'ONLINE', 'DRAINING');

-- CreateTable
CREATE TABLE "build_runner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tokenHash" TEXT NOT NULL,
    "tokenPrefix" TEXT NOT NULL,
    "labels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "maxConcurrency" INTEGER NOT NULL DEFAULT 2,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "status" "BuildRunnerStatus" NOT NULL DEFAULT 'OFFLINE',
    "lastSeenAt" TIMESTAMP(3),
    "version" TEXT,
    "platforms" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "activeJobs" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "build_runner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "build_runner_name_key" ON "build_runner"("name");

-- CreateIndex
CREATE UNIQUE INDEX "build_runner_tokenHash_key" ON "build_runner"("tokenHash");

-- CreateIndex
CREATE INDEX "build_runner_tokenHash_idx" ON "build_runner"("tokenHash");

-- CreateIndex
CREATE INDEX "build_runner_enabled_idx" ON "build_runner"("enabled");
