-- CreateTable
CREATE TABLE "git_account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gitProviderId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "providerUsername" TEXT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "git_account_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "git_account_userId_provider_idx" ON "git_account"("userId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "git_account_userId_gitProviderId_key" ON "git_account"("userId", "gitProviderId");

-- AddForeignKey
ALTER TABLE "git_account" ADD CONSTRAINT "git_account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "git_account" ADD CONSTRAINT "git_account_gitProviderId_fkey" FOREIGN KEY ("gitProviderId") REFERENCES "git_provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
