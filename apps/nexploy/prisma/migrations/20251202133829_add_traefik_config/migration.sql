-- AlterTable
ALTER TABLE "project" ADD COLUMN     "domain" TEXT,
ADD COLUMN     "traefikEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "traefik_label" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "traefik_label_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "traefik_label_projectId_key_key" ON "traefik_label"("projectId", "key");

-- AddForeignKey
ALTER TABLE "traefik_label" ADD CONSTRAINT "traefik_label_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
