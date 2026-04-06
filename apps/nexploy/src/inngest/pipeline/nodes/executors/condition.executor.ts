import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '@/types/pipeline.type';
import { conditionConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';

export class ConditionExecutor implements INodeExecutor {
    readonly type = 'condition';
    readonly configSchema = conditionConfigSchema;

    async execute(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
        const { inputOutputs, config, logger, nodeId, edges } = ctx;

        const parsed = conditionConfigSchema.safeParse(config);
        const operator = parsed.success ? parsed.data.operator : 'and';

        const hasData = (o: Record<string, unknown>) => Object.keys(o).length > 0;

        let passed: boolean;
        if (operator === 'and') {
            passed = inputOutputs.length > 0 && inputOutputs.every(hasData);
        } else {
            passed = inputOutputs.length > 0 && inputOutputs.some(hasData);
        }

        await logger.info(
            nodeId,
            `Condition [${operator.toUpperCase()}] evaluated: ${passed ? 'true' : 'false'} (${inputOutputs.length} input(s))`,
        );

        const losingHandle = passed ? 'false' : 'true';
        const skippedBranchTargets = edges
            .filter((e) => e.source === nodeId && e.sourceHandle === losingHandle)
            .map((e) => e.target);

        return {
            output: { passed, branch: passed ? 'true' : 'false' },
            skippedBranchTargets,
        };
    }
}

export const conditionExecutor = new ConditionExecutor();
