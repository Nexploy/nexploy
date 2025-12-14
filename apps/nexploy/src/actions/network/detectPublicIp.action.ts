'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { getPublicIp } from '@/lib/network/getPublicIp';

export const detectPublicIpAction = authActionServer.action(async () => {
    const ip = await getPublicIp();

    if (!ip) {
        throw new Error(
            "Impossible de détecter automatiquement l'IP publique. Veuillez l'entrer manuellement.",
        );
    }

    return { ip };
});
