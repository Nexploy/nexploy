'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';
import { getPipelineConfig, savePipelineConfig } from '@/services/pipeline.service';
import {
    saveNodeConfigBindArgsSchemas,
    saveNodeConfigInputSchema,
} from '@workspace/schemas-zod/pipeline/pipelineGraph.schema';
import { byBoundRepositoryId } from '@/lib/auth/resolveOrgContext';

export const saveNodeConfigAction = authActionServer
    .use(requirePermission('pipeline', 'update', byBoundRepositoryId))
    .bindArgsSchemas(saveNodeConfigBindArgsSchemas)
    .inputSchema(saveNodeConfigInputSchema)
    .action(
        async ({ parsedInput: config, bindArgsParsedInputs: [repositoryId, stageId, nodeId] }) => {
            const pipeline = await getPipelineConfig(stageId);
            if (!pipeline) throw new Error((await getErrorTranslator())('pipeline.configNotFound'));

            await savePipelineConfig({
                repositoryId,
                stageId,
                graph: {
                    ...pipeline,
                    nodes: pipeline.nodes.map((node) =>
                        node.id === nodeId ? { ...node, data: { ...node.data, config } } : node,
                    ),
                },
            });

            return config;
        },
    );
