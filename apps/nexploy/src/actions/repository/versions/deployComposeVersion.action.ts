'use server';

import {
    authActionServer,
    requirePermission,
    requireUnprotectedEnvironment,
    fromInputField,
} from '@/lib/api/safe-action';
import { setToastServer } from '@/lib/toastServer';
import { deployVersionSchema } from '@workspace/schemas-zod/inngest/build.schema';
import { deployComposeVersion } from '@/services/docker/version.service';
import { byRepositoryId } from '@/lib/auth/resolveOrgContext';

export const onDeployComposeVersion = authActionServer
    .metadata({ name: 'versions.deployComposeVersion' })
    .use(requirePermission('deployment', 'deploy', byRepositoryId))
    .use(
        requireUnprotectedEnvironment(
            'deployment.deploy',
            fromInputField('environmentId', { fallbackToCurrent: true }),
        ),
    )
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
