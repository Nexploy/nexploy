-- CreateTable
CREATE TABLE "deployment_stage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isProduction" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "repositoryId" TEXT NOT NULL,
    "environmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deployment_stage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "deployment_stage_repositoryId_idx" ON "deployment_stage"("repositoryId");

-- CreateIndex
CREATE UNIQUE INDEX "deployment_stage_repositoryId_slug_key" ON "deployment_stage"("repositoryId", "slug");

-- AddForeignKey
ALTER TABLE "deployment_stage" ADD CONSTRAINT "deployment_stage_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployment_stage" ADD CONSTRAINT "deployment_stage_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "environment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: create a default "Production" stage for every existing repository
INSERT INTO "deployment_stage" ("id", "name", "slug", "isProduction", "order", "repositoryId", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    'Production',
    'prod',
    true,
    0,
    "id",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "repository";

-- AlterTable: env_variable (nullable first, backfill, then enforce)
ALTER TABLE "env_variable" ADD COLUMN "stageId" TEXT;

UPDATE "env_variable" ev
SET "stageId" = ds."id"
FROM "deployment_stage" ds
WHERE ds."repositoryId" = ev."repositoryId" AND ds."slug" = 'prod';

ALTER TABLE "env_variable" ALTER COLUMN "stageId" SET NOT NULL;

-- Swap unique constraint from (repositoryId, key) to (stageId, key)
DROP INDEX "env_variable_repositoryId_key_key";
CREATE UNIQUE INDEX "env_variable_stageId_key_key" ON "env_variable"("stageId", "key");
CREATE INDEX "env_variable_repositoryId_idx" ON "env_variable"("repositoryId");

ALTER TABLE "env_variable" ADD CONSTRAINT "env_variable_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "deployment_stage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: build
ALTER TABLE "build" ADD COLUMN "stageId" TEXT;

UPDATE "build" b
SET "stageId" = ds."id"
FROM "deployment_stage" ds
WHERE ds."repositoryId" = b."repositoryId" AND ds."slug" = 'prod';

CREATE INDEX "build_stageId_idx" ON "build"("stageId");

ALTER TABLE "build" ADD CONSTRAINT "build_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "deployment_stage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: version
ALTER TABLE "version" ADD COLUMN "stageId" TEXT;

UPDATE "version" v
SET "stageId" = ds."id"
FROM "deployment_stage" ds
WHERE ds."repositoryId" = v."repositoryId" AND ds."slug" = 'prod';

CREATE INDEX "version_stageId_idx" ON "version"("stageId");

ALTER TABLE "version" ADD CONSTRAINT "version_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "deployment_stage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
