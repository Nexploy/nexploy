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

-- AlterTable
ALTER TABLE "repository" ADD COLUMN     "cpuLimit" DOUBLE PRECISION,
ADD COLUMN     "cpuReservation" DOUBLE PRECISION,
ADD COLUMN     "deploymentMode" "DeploymentMode" NOT NULL DEFAULT 'CONTAINER',
ADD COLUMN     "healthCheckCommand" TEXT,
ADD COLUMN     "healthCheckEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "healthCheckInterval" TEXT NOT NULL DEFAULT '30s',
ADD COLUMN     "healthCheckRetries" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "healthCheckStartPeriod" TEXT NOT NULL DEFAULT '0s',
ADD COLUMN     "healthCheckTimeout" TEXT NOT NULL DEFAULT '10s',
ADD COLUMN     "memoryLimit" TEXT,
ADD COLUMN     "memoryReservation" TEXT,
ADD COLUMN     "placementConstraints" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "replicas" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "restartCondition" "RestartCondition" NOT NULL DEFAULT 'ANY',
ADD COLUMN     "restartDelay" TEXT NOT NULL DEFAULT '5s',
ADD COLUMN     "restartMaxAttempts" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "restartWindow" TEXT NOT NULL DEFAULT '120s',
ADD COLUMN     "rollbackDelay" TEXT NOT NULL DEFAULT '10s',
ADD COLUMN     "rollbackFailureAction" "RollbackFailureAction" NOT NULL DEFAULT 'PAUSE',
ADD COLUMN     "rollbackParallelism" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "updateDelay" TEXT NOT NULL DEFAULT '10s',
ADD COLUMN     "updateFailureAction" "UpdateFailureAction" NOT NULL DEFAULT 'PAUSE',
ADD COLUMN     "updateOrder" "UpdateOrder" NOT NULL DEFAULT 'STOP_FIRST',
ADD COLUMN     "updateParallelism" INTEGER NOT NULL DEFAULT 1;
