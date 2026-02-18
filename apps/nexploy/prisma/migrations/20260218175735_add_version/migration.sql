-- CreateTable
CREATE TABLE "version" (
    "id" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "imageTag" TEXT NOT NULL,
    "buildType" TEXT NOT NULL,
    "branch" TEXT,
    "commitHash" TEXT,
    "commitMessage" TEXT,
    "composeConfig" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "version_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "version_repositoryId_idx" ON "version"("repositoryId");

-- CreateIndex
CREATE UNIQUE INDEX "version_repositoryId_imageTag_key" ON "version"("repositoryId", "imageTag");

-- AddForeignKey
ALTER TABLE "version" ADD CONSTRAINT "version_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;
