/*
  Warnings:

  - You are about to drop the `project` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."build" DROP CONSTRAINT "build_repositoryId_fkey";

-- DropForeignKey
ALTER TABLE "public"."env_variable" DROP CONSTRAINT "env_variable_repositoryId_fkey";

-- DropForeignKey
ALTER TABLE "public"."project" DROP CONSTRAINT "project_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."traefik_label" DROP CONSTRAINT "traefik_label_repositoryId_fkey";

-- DropTable
DROP TABLE "public"."project";

-- CreateTable
CREATE TABLE "repository" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "repositoryUrl" TEXT NOT NULL,
    "branch" TEXT NOT NULL DEFAULT 'main',
    "gitProvider" TEXT NOT NULL,
    "buildType" TEXT NOT NULL DEFAULT 'DOCKERFILE',
    "dockerfilePath" TEXT DEFAULT 'Dockerfile',
    "contextPath" TEXT DEFAULT '.',
    "buildArgs" TEXT,
    "autoDeploy" BOOLEAN NOT NULL DEFAULT true,
    "domain" TEXT,
    "traefikEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "repository_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "repository" ADD CONSTRAINT "repository_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "env_variable" ADD CONSTRAINT "env_variable_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "build" ADD CONSTRAINT "build_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "traefik_label" ADD CONSTRAINT "traefik_label_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;
