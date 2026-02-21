-- AlterTable
ALTER TABLE "build" ADD COLUMN     "environmentId" TEXT;

-- AlterTable
ALTER TABLE "version" ADD COLUMN     "environmentId" TEXT;

-- AddForeignKey
ALTER TABLE "build" ADD CONSTRAINT "build_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "environment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "version" ADD CONSTRAINT "version_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "environment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
