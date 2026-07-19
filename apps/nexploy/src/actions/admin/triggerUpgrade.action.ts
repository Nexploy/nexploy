'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { upgradeSchema } from '@workspace/schemas-zod/admin/traefikFile.schema';
import { kyDocker } from '@/lib/api/kyDocker';
import { setToastServer } from '@/lib/toastServer';

export const triggerUpgradeAction = authActionServer
    .use(requirePermission('setting', 'manage'))
    .inputSchema(upgradeSchema)
    .action(async ({ parsedInput }) => {
        if (process.env.NODE_ENV !== 'production') {
            throw new Error('Upgrading is disabled outside of production.');
        }

        try {
            await kyDocker.post('system/upgrade', { json: parsedInput, timeout: 20_000 }).json();
        } catch (error) {
            console.warn('Upgrade request was interrupted by the restart:', error);
        }

        await setToastServer({
            type: 'info',
            message: 'Nexploy is upgrading — the app will restart in a few seconds.',
        });
    });
