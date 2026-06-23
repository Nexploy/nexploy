'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { setToastServer } from '@/lib/toastServer';
import { z } from 'zod';
import { access, rm } from 'fs/promises';
import { join } from 'path';
import { getTranslations } from 'next-intl/server';
import { revalidatePath } from 'next/cache';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';

const clearCacheSchema = z.object({ repositoryId: z.string() });

export const clearCacheAction = authActionServer
    .use(requirePermission('repository', 'delete'))
    .inputSchema(clearCacheSchema)
    .action(async ({ parsedInput }) => {
        const t = await getTranslations('repository.settings.dangerZone');
        const workDir = process.env.DEPLOYER_WORK_DIR;
        if (!workDir) throw new Error((await getErrorTranslator())('repository.workDirNotConfigured'));

        const cacheDir = join(workDir, parsedInput.repositoryId);

        try {
            await access(cacheDir);
        } catch {
            await setToastServer({ type: 'error', message: t('cacheNotFound') });
            return;
        }

        await rm(cacheDir, { recursive: true, force: true, maxRetries: 3 });

        await setToastServer({ type: 'success', message: t('cacheClearedSuccess') });
        revalidatePath('/repositories/[repositoryId]', 'page');
    });
