/*
  Warnings:

  - Changed the type of `gitProvider` on the `repository` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "repository" DROP COLUMN "gitProvider",
ADD COLUMN     "gitProvider" "GitProviderType" NOT NULL;
