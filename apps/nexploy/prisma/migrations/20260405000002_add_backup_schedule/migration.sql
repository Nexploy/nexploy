-- CreateTable
CREATE TABLE "backup_schedule" (
    "id" TEXT NOT NULL,
    "volumeName" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "awsAccountId" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "backup_schedule_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "backup_schedule" ADD CONSTRAINT "backup_schedule_awsAccountId_fkey" FOREIGN KEY ("awsAccountId") REFERENCES "aws_credential"("id") ON DELETE CASCADE ON UPDATE CASCADE;
