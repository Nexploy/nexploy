'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { setToastServer } from '@/lib/toastServer';
import { deployVersionSchema } from '@workspace/schemas-zod/inngest/build.schema';
import { deployComposeVersion } from '@/services/docker/version.service';

export const onDeployComposeVersion = authActionServer
    .use(requirePermission('repository', 'deploy'))
    .inputSchema(deployVersionSchema)
    .action(async ({ parsedInput }) => {
        const { imageTag, repositoryId, environmentId } = parsedInput;
        try {
            return await deployComposeVersion(repositoryId, imageTag, environmentId);
        } catch (err) {
            if (err instanceof Error) {
                await setToastServer({ type: 'error', message: err.message });
            }
            throw err;
        }
    });
