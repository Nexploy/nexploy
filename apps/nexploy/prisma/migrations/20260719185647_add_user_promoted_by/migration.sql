-- AlterTable
ALTER TABLE "user" ADD COLUMN     "promotedById" TEXT;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_promotedById_fkey" FOREIGN KEY ("promotedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
