'use server';

import * as fs from 'fs/promises';
import * as path from 'path';
import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { moveTraefikEntrySchema } from '@workspace/schemas-zod/admin/traefikFile.schema';
import { resolveTraefikPath } from '@/lib/traefik/fileTree';
import { setToastServer } from '@/lib/toastServer';

export const moveTraefikEntry = authActionServer
    .use(requirePermission('traefik', 'manage'))
    .inputSchema(moveTraefikEntrySchema)
    .action(async ({ parsedInput: { source, destinationDir } }) => {
        try {
            const srcAbs = resolveTraefikPath(source);
            if (!srcAbs) throw new Error('Invalid source path');

            const name = path.basename(source);
            const destRel = destinationDir ? `${destinationDir}/${name}` : name;
            const destAbs = resolveTraefikPath(destRel);
            if (!destAbs) throw new Error('Invalid destination path');

            if (destAbs === srcAbs || destAbs.startsWith(srcAbs + path.sep)) {
                throw new Error('Invalid destination path');
            }

            let destExists = false;
            try {
                await fs.access(destAbs);
                destExists = true;
            } catch {}
            if (destExists) throw new Error('Destination already exists');

            await fs.mkdir(path.dirname(destAbs), { recursive: true });
            await fs.rename(srcAbs, destAbs);
        } catch (error: unknown) {
            console.log(error);
            if (error instanceof Error) {
                await setToastServer({ type: 'error', message: error.message });
            }
            throw error;
        }
    });
