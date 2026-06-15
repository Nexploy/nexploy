'use server';

import * as fs from 'fs/promises';
import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { deleteTraefikFileSchema } from '@workspace/schemas-zod/admin/traefikFile.schema';
import { resolveTraefikYmlPath } from '@/lib/traefik/fileTree';

export const deleteTraefikFile = authActionServer
    .use(requirePermission('user', 'ban'))
    .inputSchema(deleteTraefikFileSchema)
    .action(async ({ parsedInput: { filename } }) => {
        const filePath = resolveTraefikYmlPath(filename);
        if (!filePath) return { success: false };
        await fs.unlink(filePath);
        return { success: true };
    });
