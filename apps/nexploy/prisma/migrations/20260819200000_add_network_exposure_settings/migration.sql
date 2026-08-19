-- CreateTable
CREATE TABLE "network_exposure_settings" (
    "id" TEXT NOT NULL,
    "environmentId" TEXT NOT NULL DEFAULT 'default',
    "bindLoopbackOnly" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "network_exposure_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "network_exposure_settings_environmentId_key" ON "network_exposure_settings"("environmentId");
