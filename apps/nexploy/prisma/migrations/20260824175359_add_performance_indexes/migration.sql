-- CreateIndex
CREATE INDEX "backup_schedule_bucketStorageAccountId_idx" ON "backup_schedule"("bucketStorageAccountId");

-- CreateIndex
CREATE INDEX "build_repositoryId_createdAt_idx" ON "build"("repositoryId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "build_repositoryId_stageId_createdAt_idx" ON "build"("repositoryId", "stageId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "build_status_createdAt_idx" ON "build"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "dns_credential_userId_idx" ON "dns_credential"("userId");

-- CreateIndex
CREATE INDEX "environment_userId_idx" ON "environment"("userId");

-- CreateIndex
CREATE INDEX "log_buildId_step_createdAt_idx" ON "log"("buildId", "step", "createdAt");

-- CreateIndex
CREATE INDEX "repository_userId_idx" ON "repository"("userId");

-- CreateIndex
CREATE INDEX "repository_gitAccountId_idx" ON "repository"("gitAccountId");

-- CreateIndex
CREATE INDEX "version_repositoryId_createdAt_idx" ON "version"("repositoryId", "createdAt" DESC);
