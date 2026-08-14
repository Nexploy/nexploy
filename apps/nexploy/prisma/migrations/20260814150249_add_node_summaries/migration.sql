-- AlterTable
ALTER TABLE "build" ADD COLUMN     "nodeSummaries" JSONB NOT NULL DEFAULT '{}';
