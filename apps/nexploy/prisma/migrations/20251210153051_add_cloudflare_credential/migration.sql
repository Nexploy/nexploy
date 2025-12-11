-- CreateTable
CREATE TABLE "cloudflare_credential" (
    "id" TEXT NOT NULL,
    "apiToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cloudflare_credential_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cloudflare_credential_userId_key" ON "cloudflare_credential"("userId");

-- AddForeignKey
ALTER TABLE "cloudflare_credential" ADD CONSTRAINT "cloudflare_credential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
