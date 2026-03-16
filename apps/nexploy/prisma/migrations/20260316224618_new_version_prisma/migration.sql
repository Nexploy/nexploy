/*
  Warnings:

  - You are about to drop the `account` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `apikey` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `build` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cloudflare_credential` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `docker_registry` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `env_variable` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `environment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `git_account` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `git_provider` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `log` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pipeline_config` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `repository` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `session` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `twoFactor` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `verification` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `version` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "account" DROP CONSTRAINT "account_userId_fkey";

-- DropForeignKey
ALTER TABLE "build" DROP CONSTRAINT "build_environmentId_fkey";

-- DropForeignKey
ALTER TABLE "build" DROP CONSTRAINT "build_repositoryId_fkey";

-- DropForeignKey
ALTER TABLE "cloudflare_credential" DROP CONSTRAINT "cloudflare_credential_userId_fkey";

-- DropForeignKey
ALTER TABLE "env_variable" DROP CONSTRAINT "env_variable_repositoryId_fkey";

-- DropForeignKey
ALTER TABLE "environment" DROP CONSTRAINT "environment_userId_fkey";

-- DropForeignKey
ALTER TABLE "git_account" DROP CONSTRAINT "git_account_gitProviderId_fkey";

-- DropForeignKey
ALTER TABLE "git_account" DROP CONSTRAINT "git_account_userId_fkey";

-- DropForeignKey
ALTER TABLE "log" DROP CONSTRAINT "log_buildId_fkey";

-- DropForeignKey
ALTER TABLE "pipeline_config" DROP CONSTRAINT "pipeline_config_repositoryId_fkey";

-- DropForeignKey
ALTER TABLE "repository" DROP CONSTRAINT "repository_environmentId_fkey";

-- DropForeignKey
ALTER TABLE "repository" DROP CONSTRAINT "repository_gitAccountId_fkey";

-- DropForeignKey
ALTER TABLE "repository" DROP CONSTRAINT "repository_userId_fkey";

-- DropForeignKey
ALTER TABLE "session" DROP CONSTRAINT "session_userId_fkey";

-- DropForeignKey
ALTER TABLE "twoFactor" DROP CONSTRAINT "twoFactor_userId_fkey";

-- DropForeignKey
ALTER TABLE "version" DROP CONSTRAINT "version_environmentId_fkey";

-- DropForeignKey
ALTER TABLE "version" DROP CONSTRAINT "version_repositoryId_fkey";

-- DropTable
DROP TABLE "account";

-- DropTable
DROP TABLE "apikey";

-- DropTable
DROP TABLE "build";

-- DropTable
DROP TABLE "cloudflare_credential";

-- DropTable
DROP TABLE "docker_registry";

-- DropTable
DROP TABLE "env_variable";

-- DropTable
DROP TABLE "environment";

-- DropTable
DROP TABLE "git_account";

-- DropTable
DROP TABLE "git_provider";

-- DropTable
DROP TABLE "log";

-- DropTable
DROP TABLE "pipeline_config";

-- DropTable
DROP TABLE "repository";

-- DropTable
DROP TABLE "session";

-- DropTable
DROP TABLE "twoFactor";

-- DropTable
DROP TABLE "user";

-- DropTable
DROP TABLE "verification";

-- DropTable
DROP TABLE "version";

-- DropEnum
DROP TYPE "BuildStatus";

-- DropEnum
DROP TYPE "DeploymentMode";

-- DropEnum
DROP TYPE "DockerConnectionType";

-- DropEnum
DROP TYPE "LogLevel";

-- DropEnum
DROP TYPE "RestartCondition";

-- DropEnum
DROP TYPE "RollbackFailureAction";

-- DropEnum
DROP TYPE "UpdateFailureAction";

-- DropEnum
DROP TYPE "UpdateOrder";
