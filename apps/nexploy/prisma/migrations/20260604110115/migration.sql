-- AlterTable
ALTER TABLE "ai_settings" ADD COLUMN     "allowComposeGroup" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "allowEnvironmentsGroup" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "allowImagesGroup" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "allowNetworksGroup" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "allowRegistriesGroup" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "allowRepositoriesGroup" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "allowSslGroup" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "allowVolumesGroup" BOOLEAN NOT NULL DEFAULT true;
