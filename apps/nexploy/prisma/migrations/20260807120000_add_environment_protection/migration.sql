-- AlterTable
ALTER TABLE "environment" ADD COLUMN     "allowAdminBypass" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isProtected" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "protectedActions" TEXT[] DEFAULT ARRAY[]::TEXT[];
