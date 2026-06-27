-- Rename aws_credential table (and its primary key constraint) to s3_credential
ALTER TABLE "aws_credential" RENAME TO "s3_credential";
ALTER TABLE "s3_credential" RENAME CONSTRAINT "aws_credential_pkey" TO "s3_credential_pkey";

-- Rename backup_schedule foreign key column and constraint to s3AccountId
ALTER TABLE "backup_schedule" RENAME COLUMN "awsAccountId" TO "s3AccountId";
ALTER TABLE "backup_schedule" RENAME CONSTRAINT "backup_schedule_awsAccountId_fkey" TO "backup_schedule_s3AccountId_fkey";
