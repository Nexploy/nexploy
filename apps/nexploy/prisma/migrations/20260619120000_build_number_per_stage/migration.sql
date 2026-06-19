/*
  Warnings:

  - A unique constraint covering the columns `[repositoryId,stageId,number]` on the table `build` will be added.
    Build numbers are now scoped per deployment stage instead of per repository.

*/
-- DropIndex
DROP INDEX "build_repositoryId_number_key";

-- CreateIndex
CREATE UNIQUE INDEX "build_repositoryId_stageId_number_key" ON "build"("repositoryId", "stageId", "number");
