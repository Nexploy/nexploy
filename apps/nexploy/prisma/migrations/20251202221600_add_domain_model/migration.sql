-- CreateTable
CREATE TABLE "domain" (
    "id" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "path" TEXT NOT NULL DEFAULT '/',
    "internalPath" TEXT NOT NULL DEFAULT '/',
    "stripPath" BOOLEAN NOT NULL DEFAULT false,
    "containerPort" INTEGER NOT NULL DEFAULT 3000,
    "https" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "repositoryId" TEXT NOT NULL,

    CONSTRAINT "domain_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "domain" ADD CONSTRAINT "domain_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;
