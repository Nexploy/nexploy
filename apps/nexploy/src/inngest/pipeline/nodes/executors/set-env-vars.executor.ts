import { getFromClosestAncestor } from '@/types/pipeline.helpers';
import {
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
} from '@/types/pipeline.type';
import { setEnvVarsConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { z } from 'zod';

export class SetEnvVarsExecutor implements INodeExecutor {
    readonly type = 'set-env-vars';
    readonly configSchema = setEnvVarsConfigSchema;

    async execute(
        ctx: NodeExecutionContext<z.infer<typeof setEnvVarsConfigSchema>>,
    ): Promise<NodeExecutionResult> {
        const { logger, nodeId, nodeConfig, allOutputs, edges } = ctx;

        const raw = nodeConfig.vars;

        let fromNode;
        if (Array.isArray(raw)) {
            fromNode = Object.fromEntries(raw.filter((e) => e.key).map((e) => [e.key, e.value]));
        } else {
            fromNode = raw ?? {};
        }

        const existing =
            getFromClosestAncestor<Record<string, string>>(allOutputs, edges, nodeId, 'envVariables') ?? {};

        const envVariables = { ...fromNode, ...existing };

        const count = Object.keys(envVariables).length;

        if (count === 0) {
            await logger.info(nodeId, 'No variables defined, skipping');
            return { output: { envVariables: {} }, skipped: true };
        }

        await logger.info(nodeId, `Injecting ${count} environment variable(s) into the pipeline`);

        return { output: { envVariables } };
    }
}

export const setEnvVarsExecutor = new SetEnvVarsExecutor();
