/*
  Warnings:

  - A unique constraint covering the columns `[repositoryId,number]` on the table `build` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "build_repositoryId_number_key" ON "build"("repositoryId", "number");
