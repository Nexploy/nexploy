-- CreateEnum
CREATE TYPE "DockerConnectionType" AS ENUM ('UNIX_SOCKET', 'TCP', 'TCP_TLS');

-- CreateTable
CREATE TABLE "environment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "connectionType" "DockerConnectionType" NOT NULL DEFAULT 'UNIX_SOCKET',
    "socketPath" TEXT,
    "host" TEXT,
    "port" INTEGER,
    "tlsCert" TEXT,
    "tlsKey" TEXT,
    "tlsCa" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "lastHealthCheck" TIMESTAMP(3),
    "healthStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,

    CONSTRAINT "environment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "environment" ADD CONSTRAINT "environment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
