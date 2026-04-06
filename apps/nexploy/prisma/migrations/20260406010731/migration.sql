/*
  Warnings:

  - Changed the type of `frequency` on the `backup_schedule` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Frequency" AS ENUM ('HOURLY', 'DAILY', 'WEEKLY');

-- AlterTable
ALTER TABLE "backup_schedule" DROP COLUMN "frequency",
ADD COLUMN     "frequency" "Frequency" NOT NULL;
