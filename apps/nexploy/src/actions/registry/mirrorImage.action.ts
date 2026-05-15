'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { mirrorImageSchema } from '@workspace/schemas-zod/registry/mirrorImage.schema';
import { kyDocker } from '@/lib/api/kyDocker';
import { getRegistryWithPassword } from '@/services/registry.service';
import { setToastServer } from '@/lib/toastServer';
import { getTranslations } from 'next-intl/server';

async function getMirrorImageSchema() {
    const t = await getTranslations('validation');
    return mirrorImageSchema(t);
}

export const mirrorImageAction = authActionServer
    .use(requirePermission('registry', 'create'))
    .inputSchema(getMirrorImageSchema)
    .action(async ({ parsedInput }) => {
        const { sourceImage, sourceUsername, sourcePassword, targetRegistryId } = parsedInput;

        try {
            const registry = await getRegistryWithPassword(targetRegistryId);

            if (!registry) {
                throw new Error('Registry not found');
            }

            const sourceBase = sourceImage.split('/').pop() || sourceImage;
            const targetName = `${registry.url}/${sourceBase}`;

            const sourceAuth =
                sourceUsername && sourcePassword
                    ? { username: sourceUsername, password: sourcePassword }
                    : undefined;

            await kyDocker
                .post('images/mirror', {
                    json: {
                        sourceImage,
                        sourceAuth,
                        targetName,
                        targetAuth: {
                            serveraddress: registry.url,
                            username: registry.username || '',
                            password: registry.password || '',
                        },
                    },
                    timeout: false,
                })
                .json<{ success: boolean; targetName: string }>();

            return { targetName };
        } catch (err: any) {
            await setToastServer({ type: 'error', message: err.message });
            throw err;
        }
    });
