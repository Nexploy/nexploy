-- CreateEnum
CREATE TYPE "DockerAgentStatus" AS ENUM ('OFFLINE', 'ONLINE');

-- AlterEnum
ALTER TYPE "DockerConnectionType" ADD VALUE 'AGENT';

-- CreateTable
CREATE TABLE "docker_agent" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "tokenPrefix" TEXT NOT NULL,
    "status" "DockerAgentStatus" NOT NULL DEFAULT 'OFFLINE',
    "lastSeenAt" TIMESTAMP(3),
    "version" TEXT,
    "hostname" TEXT,
    "platform" TEXT,
    "architecture" TEXT,
    "dockerVersion" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "environmentId" TEXT NOT NULL,

    CONSTRAINT "docker_agent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "docker_agent_tokenHash_key" ON "docker_agent"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "docker_agent_environmentId_key" ON "docker_agent"("environmentId");

-- CreateIndex
CREATE INDEX "docker_agent_tokenHash_idx" ON "docker_agent"("tokenHash");

-- AddForeignKey
ALTER TABLE "docker_agent" ADD CONSTRAINT "docker_agent_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "environment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
