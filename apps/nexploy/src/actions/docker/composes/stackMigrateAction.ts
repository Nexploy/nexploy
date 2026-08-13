'use server';

import {
    authActionServer,
    requirePermission,
    requireUnprotectedEnvironment,
    fromInputField,
} from '@/lib/api/safe-action';
import { HTTPError } from 'ky';
import { setToastServer } from '@/lib/toastServer';
import { kyDocker } from '@/lib/api/kyDocker';
import { stackMigrateFormSchema } from '@workspace/schemas-zod/docker/composes/stackMigrate.schema';
import { getRegistryWithPassword } from '@/services/registry.service';
import { byStackName } from '@/lib/auth/resolveOrgContext';

export const onStackMigrateAction = authActionServer
    .metadata({ name: 'stack.migrate' })
    .use(requirePermission('container', 'manage', byStackName))
    .use(requireUnprotectedEnvironment('container.migrateOut'))
    .use(requireUnprotectedEnvironment('container.migrateIn', fromInputField('targetEnvironmentId')))
    .inputSchema(stackMigrateFormSchema)
    .action(
        async ({
            parsedInput: {
                stackName,
                targetEnvironmentId,
                migrateVolumeData,
                sourceAction,
                startAfterMigration,
                registryId,
            },
        }) => {
            let auth: { username: string; password: string; serveraddress: string } | undefined;

            if (registryId && registryId !== 'none') {
                const registry = await getRegistryWithPassword(registryId);
                if (registry?.username && registry.password) {
                    auth = {
                        username: registry.username,
                        password: registry.password,
                        serveraddress: registry.url,
                    };
                }
            }

            try {
                return await kyDocker
                    .post('composes/migrate', {
                        json: {
                            stackName,
                            targetEnvironmentId,
                            migrateVolumeData,
                            sourceAction,
                            startAfterMigration,
                            auth,
                        },
                    })
                    .json<{ taskId: string; name: string }>();
            } catch (err: unknown) {
                if (err instanceof HTTPError) {
                    await setToastServer({
                        type: 'error',
                        message: err.message as string,
                    });
                }
                throw err;
            }
        },
    );
