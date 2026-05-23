/*
  Warnings:

  - Added the required column `email` to the `ssl_certificate` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ssl_certificate" ADD COLUMN     "email" TEXT NOT NULL;
