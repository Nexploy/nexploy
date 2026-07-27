-- DropIndex
DROP INDEX IF EXISTS "repository_gitId_key";

-- DropIndex
DROP INDEX IF EXISTS "repository_repositoryUrl_key";

-- CreateIndex
CREATE UNIQUE INDEX "repository_organizationId_gitId_key" ON "repository"("organizationId", "gitId");

-- CreateIndex
CREATE UNIQUE INDEX "repository_organizationId_repositoryUrl_key" ON "repository"("organizationId", "repositoryUrl");

-- CreateIndex
CREATE INDEX "repository_gitId_idx" ON "repository"("gitId");

-- CreateIndex
CREATE INDEX "repository_repositoryUrl_idx" ON "repository"("repositoryUrl");
