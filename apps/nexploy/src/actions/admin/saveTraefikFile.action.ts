'use server';

import * as fs from 'fs/promises';
import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { saveTraefikFileSchema } from '@workspace/schemas-zod/admin/traefikFile.schema';
import { resolveTraefikYmlPath } from '@/lib/traefik/fileTree';
import { setToastServer } from '@/lib/toastServer';

export const saveTraefikFile = authActionServer
    .use(requirePermission('traefik', 'manage'))
    .inputSchema(saveTraefikFileSchema)
    .action(async ({ parsedInput: { filename, content } }) => {
        try {
            const filePath = resolveTraefikYmlPath(filename);
            if (!filePath) throw new Error('Invalid Traefik file path');
            await fs.writeFile(filePath, content, 'utf-8');
        } catch (error: unknown) {
            if (error instanceof Error) {
                await setToastServer({ type: 'error', message: error.message });
            }
            throw error;
        }
    });
