-- DropIndex
DROP INDEX "member_organizationId_userId_key";

-- AlterTable
ALTER TABLE "member" ALTER COLUMN "createdAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "organization" ALTER COLUMN "createdAt" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "member_organizationId_idx" ON "member"("organizationId");
