import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '@/types/pipeline.type';

export class SetEnvironmentExecutor implements INodeExecutor {
    readonly type = 'set-environment';

    async execute(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
        const { nodeConfig, logger, nodeId } = ctx;

        const environmentId = nodeConfig.environmentId as string | undefined;

        if (!environmentId) {
            throw new Error('No environment selected — configure this node with a target environment');
        }

        await logger.info(nodeId, `Environment set: ${environmentId}`);

        return {
            success: true,
            output: { environmentId },
        };
    }
}

export const setEnvironmentExecutor = new SetEnvironmentExecutor();
