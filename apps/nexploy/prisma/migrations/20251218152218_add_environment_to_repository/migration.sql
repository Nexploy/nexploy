-- AlterTable
ALTER TABLE "repository" ADD COLUMN     "environmentId" TEXT;

-- AddForeignKey
ALTER TABLE "repository" ADD CONSTRAINT "repository_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "environment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
