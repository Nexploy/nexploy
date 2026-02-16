/*
  Warnings:

  - You are about to drop the `oauth_provider` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "public"."oauth_provider";

-- CreateTable
CREATE TABLE "git_provider" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "appId" TEXT,
    "appName" TEXT,
    "clientId" TEXT,
    "clientSecret" TEXT,
    "webhookSecret" TEXT,
    "privateKey" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "git_provider_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "git_provider_provider_key" ON "git_provider"("provider");
