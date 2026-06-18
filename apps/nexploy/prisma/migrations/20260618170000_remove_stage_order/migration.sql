-- Drop the order column from deployment stages (sorting now uses createdAt)
ALTER TABLE "deployment_stage" DROP COLUMN "order";
