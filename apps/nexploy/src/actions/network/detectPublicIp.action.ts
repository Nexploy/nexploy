'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { getPublicIp } from '@/lib/network/getPublicIp';

export const detectPublicIpAction = authActionServer
    .use(requirePermission('repository', 'read'))
    .action(async () => {
    const ip = await getPublicIp();

    if (!ip) {
        throw new Error(
            'Unable to automatically detect public IP address. Please enter it manually.',
        );
    }

    return { ip };
});
