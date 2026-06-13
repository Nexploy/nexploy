'use server';

import * as fs from 'fs/promises';
import * as path from 'path';
import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { saveTraefikFileSchema } from '@workspace/schemas-zod/admin/traefikFile.schema';

const TRAEFIK_SERVICE_DIR = path.join(process.cwd(), '..', '..', 'infra', 'traefik', 'service');

export const saveTraefikFile = authActionServer
    .use(requirePermission('user', 'ban'))
    .inputSchema(saveTraefikFileSchema)
    .action(async ({ parsedInput: { filename, content } }) => {
        const filePath = path.join(TRAEFIK_SERVICE_DIR, filename);
        await fs.writeFile(filePath, content, 'utf-8');
        return { success: true };
    });
