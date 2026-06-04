-- CreateTable
CREATE TABLE "ai_settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "requireDestructiveConfirmation" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ai_settings_pkey" PRIMARY KEY ("id")
);
