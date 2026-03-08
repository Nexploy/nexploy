/*
  Warnings:

  - The values [DEPLOYING] on the enum `BuildStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `lastCompletedStep` on the `build` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "BuildStatus_new" AS ENUM ('QUEUED', 'BUILDING', 'COMPLETED', 'FAILED', 'CANCELLED');
ALTER TABLE "public"."build" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "build" ALTER COLUMN "status" TYPE "BuildStatus_new" USING ("status"::text::"BuildStatus_new");
ALTER TYPE "BuildStatus" RENAME TO "BuildStatus_old";
ALTER TYPE "BuildStatus_new" RENAME TO "BuildStatus";
DROP TYPE "public"."BuildStatus_old";
ALTER TABLE "build" ALTER COLUMN "status" SET DEFAULT 'QUEUED';
COMMIT;

-- AlterTable
ALTER TABLE "build" DROP COLUMN "lastCompletedStep";
