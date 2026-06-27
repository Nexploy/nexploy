-- Rename s3_credential table (and its primary key) to bucket_storage_credential
ALTER TABLE "s3_credential" RENAME TO "bucket_storage_credential";
ALTER TABLE "bucket_storage_credential" RENAME CONSTRAINT "s3_credential_pkey" TO "bucket_storage_credential_pkey";

-- Rename backup_schedule foreign key column and constraint
ALTER TABLE "backup_schedule" RENAME COLUMN "s3AccountId" TO "bucketStorageAccountId";
ALTER TABLE "backup_schedule" RENAME CONSTRAINT "backup_schedule_s3AccountId_fkey" TO "backup_schedule_bucketStorageAccountId_fkey";

-- Rename the backup-volume pipeline node type in stored pipeline graphs and build snapshots
UPDATE "pipeline_config"
SET "nodes" = REPLACE("nodes"::text, '"backup-volume-s3"', '"backup-volume-bucket-storage"')::jsonb
WHERE "nodes"::text LIKE '%"backup-volume-s3"%';

UPDATE "build"
SET "pipelineSnapshot" = REPLACE("pipelineSnapshot"::text, '"backup-volume-s3"', '"backup-volume-bucket-storage"')::jsonb
WHERE "pipelineSnapshot" IS NOT NULL AND "pipelineSnapshot"::text LIKE '%"backup-volume-s3"%';
