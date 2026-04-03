import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '@/types/pipeline.type';
import { updateBuildEnvironment } from '@/services/inngest/build.inngest.service';
import { setEnvironmentConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';

export class SetEnvironmentExecutor implements INodeExecutor {
    readonly type = 'set-environment';
    readonly configSchema = setEnvironmentConfigSchema;

    async execute(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
        const { buildId, nodeConfig, logger, nodeId } = ctx;

        const environmentId = nodeConfig.environmentId as string | undefined;

        if (!environmentId) {
            throw new Error(
                'No environment selected — configure this node with a target environment',
            );
        }

        await updateBuildEnvironment(buildId, environmentId);

        await logger.info(nodeId, `Environment set: ${environmentId}`);

        return {
            success: true,
            output: { environmentId },
        };
    }
}

export const setEnvironmentExecutor = new SetEnvironmentExecutor();
