'use server';

import * as fs from 'fs/promises';
import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { deleteTraefikFileSchema } from '@workspace/schemas-zod/admin/traefikFile.schema';
import { resolveTraefikYmlPath } from '@/lib/traefik/fileTree';
import { setToastServer } from '@/lib/toastServer';

export const deleteTraefikFile = authActionServer
    .use(requirePermission('traefik', 'manage'))
    .inputSchema(deleteTraefikFileSchema)
    .action(async ({ parsedInput: { filename } }) => {
        try {
            const filePath = resolveTraefikYmlPath(filename);
            if (!filePath) throw new Error('Invalid Traefik file path');
            await fs.unlink(filePath);
        } catch (error: unknown) {
            if (error instanceof Error) {
                await setToastServer({ type: 'error', message: error.message });
            }
            throw error;
        }
    });
