-- AlterEnum
ALTER TYPE "BuildType" ADD VALUE 'NODE_PIPELINE';

-- CreateTable
CREATE TABLE "pipeline_config" (
    "id" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "nodes" JSONB NOT NULL,
    "edges" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pipeline_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pipeline_config_repositoryId_key" ON "pipeline_config"("repositoryId");

-- AddForeignKey
ALTER TABLE "pipeline_config" ADD CONSTRAINT "pipeline_config_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;
