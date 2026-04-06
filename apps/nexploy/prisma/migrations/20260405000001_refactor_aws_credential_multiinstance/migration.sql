-- Drop old single-user aws_credential table and recreate as multi-instance (global, no userId)
DROP TABLE IF EXISTS "aws_credential";

-- CreateTable
CREATE TABLE "aws_credential" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "accessKeyId" TEXT NOT NULL,
    "secretAccessKey" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aws_credential_pkey" PRIMARY KEY ("id")
);
