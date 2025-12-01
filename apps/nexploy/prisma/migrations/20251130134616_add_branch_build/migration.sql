/*
  Warnings:

  - Added the required column `branch` to the `build` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "build" ADD COLUMN     "branch" TEXT NOT NULL;
