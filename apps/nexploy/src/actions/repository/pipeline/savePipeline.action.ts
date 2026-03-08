'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { savePipelineSchema } from '@workspace/schemas-zod/pipeline/pipelineGraph.schema';
import { savePipelineConfig } from '@/services/pipeline.service';
import { setToastServer } from '@/lib/toastServer';
import { getTranslations } from 'next-intl/server';

export const savePipelineAction = authActionServer
    .use(requirePermission('repository', 'update'))
    .inputSchema(savePipelineSchema)
    .action(async ({ parsedInput }) => {
        const t = await getTranslations('repository');
        try {
            await savePipelineConfig(parsedInput);
        } catch (error) {
            await setToastServer({
                type: 'error',
                message: error instanceof Error ? error.message : t('pipeline.saveError'),
            });
            throw error;
        }
    });
