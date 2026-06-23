'use server';

import * as fs from 'fs/promises';
import * as path from 'path';
import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { moveTraefikEntrySchema } from '@workspace/schemas-zod/admin/traefikFile.schema';
import { resolveTraefikPath } from '@/lib/traefik/fileTree';

export const moveTraefikEntry = authActionServer
    .use(requirePermission('traefik', 'manage'))
    .inputSchema(moveTraefikEntrySchema)
    .action(async ({ parsedInput: { source, destinationDir } }) => {
        const srcAbs = resolveTraefikPath(source);
        if (!srcAbs) return { success: false };

        const name = path.basename(source);
        const destRel = destinationDir ? `${destinationDir}/${name}` : name;
        const destAbs = resolveTraefikPath(destRel);
        if (!destAbs) return { success: false };

        if (destAbs === srcAbs || destAbs.startsWith(srcAbs + path.sep)) {
            return { success: false };
        }

        try {
            await fs.access(destAbs);
            return { success: false };
        } catch {}

        await fs.mkdir(path.dirname(destAbs), { recursive: true });
        await fs.rename(srcAbs, destAbs);

        return { success: true };
    });
