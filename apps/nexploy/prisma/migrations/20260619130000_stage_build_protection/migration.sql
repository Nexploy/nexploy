-- AlterTable: add build-gate self relation on deployment_stage
ALTER TABLE "deployment_stage" ADD COLUMN "requiredStageId" TEXT;

-- CreateIndex
CREATE INDEX "deployment_stage_requiredStageId_idx" ON "deployment_stage"("requiredStageId");

-- AddForeignKey
ALTER TABLE "deployment_stage" ADD CONSTRAINT "deployment_stage_requiredStageId_fkey" FOREIGN KEY ("requiredStageId") REFERENCES "deployment_stage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
