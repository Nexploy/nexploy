import { prisma } from '../../prisma/prisma';
import {
    ALL_INTERFACES_HOST_IP,
    LOOPBACK_HOST_IP,
    type UpdateNetworkExposureSettings,
} from '@workspace/schemas-zod/docker/system/networkExposure.schema';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';

export const NETWORK_EXPOSURE_SETTINGS_KEY = 'default';

export async function getNetworkExposureSettings() {
    const t = await getErrorTranslator();
    try {
        return await prisma.networkExposureSettings.upsert({
            where: { environmentId: NETWORK_EXPOSURE_SETTINGS_KEY },
            create: { environmentId: NETWORK_EXPOSURE_SETTINGS_KEY },
            update: {},
        });
    } catch (error: unknown) {
        console.error('[networkExposure] Failed to read the network exposure settings', error);
        throw new Error(t('networkExposure.getFailed'), { cause: error });
    }
}

export async function updateNetworkExposureSettings(data: UpdateNetworkExposureSettings) {
    const t = await getErrorTranslator();
    try {
        return await prisma.networkExposureSettings.upsert({
            where: { environmentId: NETWORK_EXPOSURE_SETTINGS_KEY },
            create: { environmentId: NETWORK_EXPOSURE_SETTINGS_KEY, ...data },
            update: data,
        });
    } catch (error: unknown) {
        console.error('[networkExposure] Failed to save the network exposure settings', error);
        throw new Error(t('networkExposure.updateFailed'), { cause: error });
    }
}

export async function getPortBindingHostIp(): Promise<string> {
    try {
        const settings = await prisma.networkExposureSettings.findUnique({
            where: { environmentId: NETWORK_EXPOSURE_SETTINGS_KEY },
            select: { bindLoopbackOnly: true },
        });

        return settings?.bindLoopbackOnly ? LOOPBACK_HOST_IP : ALL_INTERFACES_HOST_IP;
    } catch (error: unknown) {
        console.error('[networkExposure] Failed to resolve the port binding host IP', error);
        return ALL_INTERFACES_HOST_IP;
    }
}
