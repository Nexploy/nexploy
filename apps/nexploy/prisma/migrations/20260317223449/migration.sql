/*
  Warnings:

  - You are about to drop the column `autoDeploy` on the `repository` table. All the data in the column will be lost.
  - You are about to drop the column `cpuLimit` on the `repository` table. All the data in the column will be lost.
  - You are about to drop the column `cpuReservation` on the `repository` table. All the data in the column will be lost.
  - You are about to drop the column `deploymentMode` on the `repository` table. All the data in the column will be lost.
  - You are about to drop the column `healthCheckCommand` on the `repository` table. All the data in the column will be lost.
  - You are about to drop the column `healthCheckEnabled` on the `repository` table. All the data in the column will be lost.
  - You are about to drop the column `healthCheckInterval` on the `repository` table. All the data in the column will be lost.
  - You are about to drop the column `healthCheckRetries` on the `repository` table. All the data in the column will be lost.
  - You are about to drop the column `healthCheckStartPeriod` on the `repository` table. All the data in the column will be lost.
  - You are about to drop the column `healthCheckTimeout` on the `repository` table. All the data in the column will be lost.
  - You are about to drop the column `memoryLimit` on the `repository` table. All the data in the column will be lost.
  - You are about to drop the column `memoryReservation` on the `repository` table. All the data in the column will be lost.
  - You are about to drop the column `placementConstraints` on the `repository` table. All the data in the column will be lost.
  - You are about to drop the column `replicas` on the `repository` table. All the data in the column will be lost.
  - You are about to drop the column `restartCondition` on the `repository` table. All the data in the column will be lost.
  - You are about to drop the column `restartDelay` on the `repository` table. All the data in the column will be lost.
  - You are about to drop the column `restartMaxAttempts` on the `repository` table. All the data in the column will be lost.
  - You are about to drop the column `restartWindow` on the `repository` table. All the data in the column will be lost.
  - You are about to drop the column `rollbackDelay` on the `repository` table. All the data in the column will be lost.
  - You are about to drop the column `rollbackFailureAction` on the `repository` table. All the data in the column will be lost.
  - You are about to drop the column `rollbackParallelism` on the `repository` table. All the data in the column will be lost.
  - You are about to drop the column `updateDelay` on the `repository` table. All the data in the column will be lost.
  - You are about to drop the column `updateFailureAction` on the `repository` table. All the data in the column will be lost.
  - You are about to drop the column `updateOrder` on the `repository` table. All the data in the column will be lost.
  - You are about to drop the column `updateParallelism` on the `repository` table. All the data in the column will be lost.
  - You are about to drop the column `webhookId` on the `repository` table. All the data in the column will be lost.
  - You are about to drop the column `webhookSecret` on the `repository` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "repository" DROP COLUMN "autoDeploy",
DROP COLUMN "cpuLimit",
DROP COLUMN "cpuReservation",
DROP COLUMN "deploymentMode",
DROP COLUMN "healthCheckCommand",
DROP COLUMN "healthCheckEnabled",
DROP COLUMN "healthCheckInterval",
DROP COLUMN "healthCheckRetries",
DROP COLUMN "healthCheckStartPeriod",
DROP COLUMN "healthCheckTimeout",
DROP COLUMN "memoryLimit",
DROP COLUMN "memoryReservation",
DROP COLUMN "placementConstraints",
DROP COLUMN "replicas",
DROP COLUMN "restartCondition",
DROP COLUMN "restartDelay",
DROP COLUMN "restartMaxAttempts",
DROP COLUMN "restartWindow",
DROP COLUMN "rollbackDelay",
DROP COLUMN "rollbackFailureAction",
DROP COLUMN "rollbackParallelism",
DROP COLUMN "updateDelay",
DROP COLUMN "updateFailureAction",
DROP COLUMN "updateOrder",
DROP COLUMN "updateParallelism",
DROP COLUMN "webhookId",
DROP COLUMN "webhookSecret";

-- DropEnum
DROP TYPE "DeploymentMode";

-- DropEnum
DROP TYPE "RestartCondition";

-- DropEnum
DROP TYPE "RollbackFailureAction";

-- DropEnum
DROP TYPE "UpdateFailureAction";

-- DropEnum
DROP TYPE "UpdateOrder";
