import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '@/types/pipeline.type';
import { findClosestEnabledNodes } from '@/helpers/pipeline.helpers';
import { conditionConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { z } from 'zod';

export class ConditionExecutor implements INodeExecutor {
    readonly type = 'condition';
    readonly configSchema = conditionConfigSchema;

    async execute(
        ctx: NodeExecutionContext<z.infer<typeof conditionConfigSchema>>,
    ): Promise<NodeExecutionResult> {
        const { logger, nodeId, edges, nodes, allOutputs, nodeConfig } = ctx;

        const enabledParents = findClosestEnabledNodes(nodeId, nodes, edges);
        const effectiveOutputs = enabledParents
            .map((n) => allOutputs.get(n.id))
            .filter((o): o is Record<string, unknown> => o !== undefined);

        const hasData = (o: Record<string, unknown>) => Object.keys(o).length > 0;

        let passed: boolean;
        if (nodeConfig.operator === 'and') {
            passed = effectiveOutputs.length > 0 && effectiveOutputs.every(hasData);
        } else {
            passed = effectiveOutputs.length > 0 && effectiveOutputs.some(hasData);
        }

        await logger.info(
            nodeId,
            `Condition [${nodeConfig.operator.toUpperCase()}] evaluated: ${passed ? 'true' : 'false'} (${effectiveOutputs.length} effective input(s))`,
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
