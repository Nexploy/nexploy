-- CreateEnum
CREATE TYPE "DnsProviderType" AS ENUM ('CLOUDFLARE');

-- RenameTable
ALTER TABLE "cloudflare_credential" RENAME TO "dns_credential";

-- RenameColumn
ALTER TABLE "dns_credential" RENAME COLUMN "apiToken" TO "credentials";

-- AlterTable
ALTER TABLE "dns_credential" ADD COLUMN "provider" "DnsProviderType" NOT NULL DEFAULT 'CLOUDFLARE';

-- RenameConstraint
ALTER TABLE "dns_credential" RENAME CONSTRAINT "cloudflare_credential_pkey" TO "dns_credential_pkey";
ALTER TABLE "dns_credential" RENAME CONSTRAINT "cloudflare_credential_userId_fkey" TO "dns_credential_userId_fkey";
