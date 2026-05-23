-- CreateEnum
CREATE TYPE "CertType" AS ENUM ('LETS_ENCRYPT', 'CUSTOM');

-- CreateTable
CREATE TABLE "ssl_certificate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CertType" NOT NULL,
    "domain" TEXT NOT NULL,
    "certificate" TEXT,
    "privateKey" TEXT,
    "expiresAt" TIMESTAMP(3),
    "repositoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ssl_certificate_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ssl_certificate" ADD CONSTRAINT "ssl_certificate_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;
