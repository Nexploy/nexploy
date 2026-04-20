/*
  Warnings:

  - Added the required column `displayName` to the `cloudflare_credential` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "cloudflare_credential_userId_key";

-- AlterTable
ALTER TABLE "cloudflare_credential" ADD COLUMN     "displayName" TEXT NOT NULL;
