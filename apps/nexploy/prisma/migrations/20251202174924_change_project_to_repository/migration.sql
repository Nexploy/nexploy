/*
  Warnings:

  - You are about to drop the column `projectId` on the `build` table. All the data in the column will be lost.
  - You are about to drop the column `projectId` on the `env_variable` table. All the data in the column will be lost.
  - You are about to drop the column `projectId` on the `traefik_label` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[repositoryId,key]` on the table `env_variable` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[repositoryId,key]` on the table `traefik_label` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `repositoryId` to the `build` table without a default value. This is not possible if the table is not empty.
  - Added the required column `repositoryId` to the `env_variable` table without a default value. This is not possible if the table is not empty.
  - Added the required column `repositoryId` to the `traefik_label` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."build" DROP CONSTRAINT "build_projectId_fkey";

-- DropForeignKey
ALTER TABLE "public"."env_variable" DROP CONSTRAINT "env_variable_projectId_fkey";

-- DropForeignKey
ALTER TABLE "public"."traefik_label" DROP CONSTRAINT "traefik_label_projectId_fkey";

-- DropIndex
DROP INDEX "public"."env_variable_projectId_key_key";

-- DropIndex
DROP INDEX "public"."traefik_label_projectId_key_key";

-- AlterTable
ALTER TABLE "build" DROP COLUMN "projectId",
ADD COLUMN     "repositoryId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "env_variable" DROP COLUMN "projectId",
ADD COLUMN     "repositoryId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "traefik_label" DROP COLUMN "projectId",
ADD COLUMN     "repositoryId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "env_variable_repositoryId_key_key" ON "env_variable"("repositoryId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "traefik_label_repositoryId_key_key" ON "traefik_label"("repositoryId", "key");

-- AddForeignKey
ALTER TABLE "env_variable" ADD CONSTRAINT "env_variable_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "build" ADD CONSTRAINT "build_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "traefik_label" ADD CONSTRAINT "traefik_label_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
