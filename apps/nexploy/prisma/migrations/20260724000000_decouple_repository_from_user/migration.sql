-- DropForeignKey
ALTER TABLE "repository" DROP CONSTRAINT "repository_userId_fkey";

-- AlterTable
ALTER TABLE "repository" ALTER COLUMN "userId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "repository" ADD CONSTRAINT "repository_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
