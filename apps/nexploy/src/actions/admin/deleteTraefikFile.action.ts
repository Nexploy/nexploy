'use server';

import * as fs from 'fs/promises';
import * as path from 'path';
import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { deleteTraefikFileSchema } from '@workspace/schemas-zod/admin/traefikFile.schema';

const TRAEFIK_SERVICE_DIR = path.join(process.cwd(), '..', '..', 'infra', 'traefik', 'service');

export const deleteTraefikFile = authActionServer
    .use(requirePermission('user', 'ban'))
    .inputSchema(deleteTraefikFileSchema)
    .action(async ({ parsedInput: { filename } }) => {
        const filePath = path.join(TRAEFIK_SERVICE_DIR, filename);
        await fs.unlink(filePath);
        return { success: true };
    });
