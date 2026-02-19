-- AlterTable
ALTER TABLE "repository" ADD COLUMN     "gitAccountId" TEXT;

-- AddForeignKey
ALTER TABLE "repository" ADD CONSTRAINT "repository_gitAccountId_fkey" FOREIGN KEY ("gitAccountId") REFERENCES "git_account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
