'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { instanceDomainSchema } from '@workspace/schemas-zod/admin/traefikFile.schema';
import { kyDocker } from '@/lib/api/kyDocker';
import { setToastServer } from '@/lib/toastServer';

export const updateInstanceDomainAction = authActionServer
    .use(requirePermission('traefik', 'manage'))
    .inputSchema(instanceDomainSchema)
    .action(async ({ parsedInput }) => {
        try {
            await kyDocker
                .post('system/instance-domain', { json: parsedInput, timeout: 10_000 })
                .json();
        } catch (error) {
            console.warn('Instance domain update request was interrupted by the redeploy:', error);
        }

        await setToastServer({
            type: 'info',
            message:
                'Nexploy is restarting with the new domain settings — this takes a few seconds.',
        });
    });
