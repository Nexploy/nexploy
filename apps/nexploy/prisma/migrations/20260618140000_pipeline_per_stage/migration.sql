-- AlterTable: pipeline_config becomes scoped per deployment stage
ALTER TABLE "pipeline_config" ADD COLUMN "stageId" TEXT;

-- Backfill: attach each existing pipeline config to its repository's production stage
UPDATE "pipeline_config" pc
SET "stageId" = ds."id"
FROM "deployment_stage" ds
WHERE ds."repositoryId" = pc."repositoryId" AND ds."slug" = 'prod';

-- Drop any config that could not be matched to a stage (should not happen after backfill)
DELETE FROM "pipeline_config" WHERE "stageId" IS NULL;

ALTER TABLE "pipeline_config" ALTER COLUMN "stageId" SET NOT NULL;

-- Swap uniqueness from repositoryId to stageId
DROP INDEX "pipeline_config_repositoryId_key";
CREATE UNIQUE INDEX "pipeline_config_stageId_key" ON "pipeline_config"("stageId");
CREATE INDEX "pipeline_config_repositoryId_idx" ON "pipeline_config"("repositoryId");

ALTER TABLE "pipeline_config" ADD CONSTRAINT "pipeline_config_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "deployment_stage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
