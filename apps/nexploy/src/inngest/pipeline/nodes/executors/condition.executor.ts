import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '@/types/pipeline.type';
import { conditionConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';

export class ConditionExecutor implements INodeExecutor {
    readonly type = 'condition';
    readonly configSchema = conditionConfigSchema;

    async execute(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
        const { inputOutputs, logger, nodeId, edges } = ctx;

        const passed =
            inputOutputs.length > 0 && inputOutputs.some((o) => Object.keys(o).length > 0);

        await logger.info(
            nodeId,
            `Condition evaluated: ${passed ? 'true' : 'false'} (${inputOutputs.length} input(s), ${passed ? 'at least one has data' : 'none have data'})`,
        );

        const losingHandle = passed ? 'false' : 'true';
        const skippedBranchTargets = edges
            .filter((e) => e.source === nodeId && e.sourceHandle === losingHandle)
            .map((e) => e.target);

        return {
            success: true,
            output: { passed, branch: passed ? 'true' : 'false' },
            skippedBranchTargets,
        };
    }
}

export const conditionExecutor = new ConditionExecutor();
