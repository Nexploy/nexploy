import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '@/types/pipeline.type';

export class ConditionExecutor implements INodeExecutor {
    readonly type = 'condition';

    async execute(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
        const { inputOutputs, logger, nodeId } = ctx;

        const passed =
            inputOutputs.length > 0 &&
            inputOutputs.some((o) => Object.keys(o).length > 0);

        await logger.info(
            nodeId,
            `Condition evaluated: ${passed ? 'true' : 'false'} (${inputOutputs.length} input(s), ${passed ? 'at least one has data' : 'none have data'})`,
        );

        return { success: true, output: { passed, branch: passed ? 'true' : 'false' } };
    }
}

export const conditionExecutor = new ConditionExecutor();
