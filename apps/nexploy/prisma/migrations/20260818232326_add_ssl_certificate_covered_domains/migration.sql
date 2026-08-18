-- AlterTable
ALTER TABLE "ssl_certificate" ADD COLUMN     "coveredDomains" TEXT[] DEFAULT ARRAY[]::TEXT[];
