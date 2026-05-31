/*
  Warnings:

  - Changed the type of `provider` on the `git_account` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `provider` on the `git_provider` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "GitProviderType" AS ENUM ('GITHUB', 'GITLAB');

-- AlterTable
ALTER TABLE "git_account" DROP COLUMN "provider",
ADD COLUMN     "provider" "GitProviderType" NOT NULL;

-- AlterTable
ALTER TABLE "git_provider" DROP COLUMN "provider",
ADD COLUMN     "provider" "GitProviderType" NOT NULL;

-- CreateIndex
CREATE INDEX "git_account_userId_provider_idx" ON "git_account"("userId", "provider");
