-- Make SSL certificates global (remove repository association)
ALTER TABLE "ssl_certificate" DROP CONSTRAINT "ssl_certificate_repositoryId_fkey";
ALTER TABLE "ssl_certificate" DROP COLUMN "repositoryId";
