'use server';

import * as fs from 'fs/promises';
import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { saveTraefikFileSchema } from '@workspace/schemas-zod/admin/traefikFile.schema';
import { resolveTraefikYmlPath } from '@/lib/traefik/fileTree';

export const saveTraefikFile = authActionServer
    .use(requirePermission('user', 'ban'))
    .inputSchema(saveTraefikFileSchema)
    .action(async ({ parsedInput: { filename, content } }) => {
        const filePath = resolveTraefikYmlPath(filename);
        if (!filePath) return { success: false };
        await fs.writeFile(filePath, content, 'utf-8');
        return { success: true };
    });
