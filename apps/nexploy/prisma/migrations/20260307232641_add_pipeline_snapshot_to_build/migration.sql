-- AlterTable
ALTER TABLE "build" ADD COLUMN     "completedNodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "pipelineSnapshot" JSONB;
