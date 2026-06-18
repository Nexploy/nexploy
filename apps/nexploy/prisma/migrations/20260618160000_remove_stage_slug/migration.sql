-- Drop the slug column from deployment stages (no longer used at runtime)
DROP INDEX "deployment_stage_repositoryId_slug_key";
ALTER TABLE "deployment_stage" DROP COLUMN "slug";
