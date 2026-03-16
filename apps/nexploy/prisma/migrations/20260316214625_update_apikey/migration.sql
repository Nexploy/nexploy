/*
  Warnings:

  - You are about to drop the column `userId` on the `apikey` table. All the data in the column will be lost.
  - Added the required column `referenceId` to the `apikey` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."apikey" DROP CONSTRAINT "apikey_userId_fkey";

-- DropIndex
DROP INDEX "public"."apikey_userId_idx";

-- AlterTable
ALTER TABLE "apikey" DROP COLUMN "userId",
ADD COLUMN     "configId" TEXT NOT NULL DEFAULT 'default',
ADD COLUMN     "referenceId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "user" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "verification" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "apikey_configId_idx" ON "apikey"("configId");

-- CreateIndex
CREATE INDEX "apikey_referenceId_idx" ON "apikey"("referenceId");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE INDEX "twoFactor_secret_idx" ON "twoFactor"("secret");

-- CreateIndex
CREATE INDEX "twoFactor_userId_idx" ON "twoFactor"("userId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");
