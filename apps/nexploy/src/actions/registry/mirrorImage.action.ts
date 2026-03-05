'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { mirrorImageSchema } from '@workspace/schemas-zod/registry/mirrorImage.schema';
import { kyDocker } from '@/lib/api/kyDocker';
import { prisma } from '../../../prisma/prisma';
import { decrypt } from '@/lib/encryption';

export const mirrorImageAction = authActionServer
    .use(requirePermission('registry', 'create'))
    .inputSchema(mirrorImageSchema)
    .action(async ({ parsedInput }) => {
        const { sourceImage, sourceUsername, sourcePassword, targetRegistryId } = parsedInput;

        const registry = await prisma.dockerRegistry.findUnique({
            where: { id: targetRegistryId },
            select: { url: true, username: true, password: true },
        });

        if (!registry) {
            throw new Error('Registry not found');
        }

        const targetPassword = registry.password ? decrypt(registry.password) : '';

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
                        password: targetPassword,
                    },
                },
                timeout: false,
            })
            .json<{ success: boolean; targetName: string }>();

        return { targetName };
    });
