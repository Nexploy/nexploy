/*
  Warnings:

  - You are about to drop the column `certificate` on the `ssl_certificate` table. All the data in the column will be lost.
  - You are about to drop the column `privateKey` on the `ssl_certificate` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ssl_certificate" DROP COLUMN "certificate",
DROP COLUMN "privateKey";
