-- CreateTable
CREATE TABLE "cleanup_settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "scheduledHour" INTEGER NOT NULL DEFAULT 3,
    "cleanImages" BOOLEAN NOT NULL DEFAULT true,
    "cleanVolumes" BOOLEAN NOT NULL DEFAULT false,
    "cleanContainers" BOOLEAN NOT NULL DEFAULT true,
    "cleanBuild" BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" TIMESTAMP(3),
    "lastReclaimed" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "cleanup_settings_pkey" PRIMARY KEY ("id")
);
