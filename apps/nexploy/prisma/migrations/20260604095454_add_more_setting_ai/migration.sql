-- AlterTable
ALTER TABLE "ai_settings" ADD COLUMN     "aiEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "allowExecInContainer" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "allowSwarmOperations" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "customSystemPrompt" TEXT,
ADD COLUMN     "maxSteps" INTEGER NOT NULL DEFAULT 10;
