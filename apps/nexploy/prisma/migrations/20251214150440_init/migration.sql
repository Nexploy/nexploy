-- CreateEnum
CREATE TYPE "BuildType" AS ENUM ('DOCKERFILE', 'DOCKER_COMPOSE', 'NIXPACKS', 'BUILDPACKS');

-- CreateEnum
CREATE TYPE "LogLevel" AS ENUM ('INFO', 'WARN', 'ERROR', 'DEBUG');

-- CreateEnum
CREATE TYPE "BuildStatus" AS ENUM ('QUEUED', 'BUILDING', 'COMPLETED', 'FAILED', 'DEPLOYING', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DeploymentMode" AS ENUM ('CONTAINER', 'SWARM');

-- CreateEnum
CREATE TYPE "UpdateFailureAction" AS ENUM ('CONTINUE', 'PAUSE', 'ROLLBACK');

-- CreateEnum
CREATE TYPE "UpdateOrder" AS ENUM ('STOP_FIRST', 'START_FIRST');

-- CreateEnum
CREATE TYPE "RollbackFailureAction" AS ENUM ('CONTINUE', 'PAUSE');

-- CreateEnum
CREATE TYPE "RestartCondition" AS ENUM ('NONE', 'ON_FAILURE', 'ANY');

-- CreateTable
CREATE TABLE "cloudflare_credential" (
    "id" TEXT NOT NULL,
    "apiToken" TEXT NOT NULL,
    "serverIp" TEXT NOT NULL DEFAULT '',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cloudflare_credential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repository" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "repositoryUrl" TEXT NOT NULL,
    "branch" TEXT NOT NULL DEFAULT 'main',
    "gitProvider" TEXT NOT NULL,
    "gitId" TEXT NOT NULL,
    "buildType" "BuildType" NOT NULL DEFAULT 'DOCKERFILE',
    "dockerfilePath" TEXT DEFAULT 'Dockerfile',
    "dockerComposePath" TEXT DEFAULT 'docker-compose.yml',
    "contextPath" TEXT DEFAULT '.',
    "buildArgs" TEXT,
    "autoDeploy" BOOLEAN NOT NULL DEFAULT true,
    "webhookId" TEXT,
    "webhookSecret" TEXT,
    "deploymentMode" "DeploymentMode" NOT NULL DEFAULT 'CONTAINER',
    "replicas" INTEGER NOT NULL DEFAULT 1,
    "updateParallelism" INTEGER NOT NULL DEFAULT 1,
    "updateDelay" TEXT NOT NULL DEFAULT '10s',
    "updateFailureAction" "UpdateFailureAction" NOT NULL DEFAULT 'PAUSE',
    "updateOrder" "UpdateOrder" NOT NULL DEFAULT 'STOP_FIRST',
    "rollbackParallelism" INTEGER NOT NULL DEFAULT 1,
    "rollbackDelay" TEXT NOT NULL DEFAULT '10s',
    "rollbackFailureAction" "RollbackFailureAction" NOT NULL DEFAULT 'PAUSE',
    "restartCondition" "RestartCondition" NOT NULL DEFAULT 'ANY',
    "restartDelay" TEXT NOT NULL DEFAULT '5s',
    "restartMaxAttempts" INTEGER NOT NULL DEFAULT 3,
    "restartWindow" TEXT NOT NULL DEFAULT '120s',
    "cpuLimit" DOUBLE PRECISION,
    "cpuReservation" DOUBLE PRECISION,
    "memoryLimit" TEXT,
    "memoryReservation" TEXT,
    "placementConstraints" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "healthCheckEnabled" BOOLEAN NOT NULL DEFAULT false,
    "healthCheckCommand" TEXT,
    "healthCheckInterval" TEXT NOT NULL DEFAULT '30s',
    "healthCheckTimeout" TEXT NOT NULL DEFAULT '10s',
    "healthCheckRetries" INTEGER NOT NULL DEFAULT 3,
    "healthCheckStartPeriod" TEXT NOT NULL DEFAULT '0s',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "repository_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "env_variable" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "repositoryId" TEXT NOT NULL,

    CONSTRAINT "env_variable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "build" (
    "id" TEXT NOT NULL,
    "status" "BuildStatus" NOT NULL DEFAULT 'QUEUED',
    "branch" TEXT NOT NULL,
    "commitHash" TEXT,
    "commitMessage" TEXT,
    "lastCompletedStep" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "repositoryId" TEXT NOT NULL,

    CONSTRAINT "build_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "log" (
    "id" TEXT NOT NULL,
    "level" "LogLevel" NOT NULL DEFAULT 'INFO',
    "step" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "buildId" TEXT NOT NULL,

    CONSTRAINT "log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" TEXT,
    "banned" BOOLEAN DEFAULT false,
    "banReason" TEXT,
    "banExpires" TIMESTAMP(3),
    "twoFactorEnabled" BOOLEAN DEFAULT false,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    "impersonatedBy" TEXT,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "twoFactor" (
    "id" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "backupCodes" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "twoFactor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitation" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "inviterId" TEXT NOT NULL,
    "role" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cloudflare_credential_userId_key" ON "cloudflare_credential"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "repository_repositoryUrl_key" ON "repository"("repositoryUrl");

-- CreateIndex
CREATE UNIQUE INDEX "repository_gitId_key" ON "repository"("gitId");

-- CreateIndex
CREATE UNIQUE INDEX "env_variable_repositoryId_key_key" ON "env_variable"("repositoryId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- AddForeignKey
ALTER TABLE "cloudflare_credential" ADD CONSTRAINT "cloudflare_credential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repository" ADD CONSTRAINT "repository_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "env_variable" ADD CONSTRAINT "env_variable_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "build" ADD CONSTRAINT "build_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log" ADD CONSTRAINT "log_buildId_fkey" FOREIGN KEY ("buildId") REFERENCES "build"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "twoFactor" ADD CONSTRAINT "twoFactor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
