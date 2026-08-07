'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { setToastServer } from '@/lib/toastServer';
import { updateEnvironmentProtection } from '@/services/environment/environmentProtection.service';
import { environmentProtectionSchema } from '@workspace/schemas-zod/docker/environment/environmentProtection.schema';

export const updateEnvironmentProtectionAction = authActionServer
    .metadata({ name: 'environment.protection.update' })
    .use(requirePermission('environment', 'update'))
    .inputSchema(environmentProtectionSchema)
    .action(async ({ parsedInput }) => {
        try {
            return await updateEnvironmentProtection(parsedInput);
        } catch (err: unknown) {
            if (err instanceof Error) {
                await setToastServer({ type: 'error', message: err.message });
            }
            throw err;
        }
    });
