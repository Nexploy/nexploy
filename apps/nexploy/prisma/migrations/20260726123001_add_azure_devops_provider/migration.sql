-- AlterEnum
ALTER TYPE "GitProviderType" ADD VALUE 'AZURE_DEVOPS';

-- AlterTable
ALTER TABLE "git_provider" ADD COLUMN     "tenantId" TEXT;
