import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '@/types/pipeline.type';
import { setEnvVarsConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';

export class SetEnvVarsExecutor implements INodeExecutor {
    readonly type = 'set-env-vars';
    readonly configSchema = setEnvVarsConfigSchema;

    async execute(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
        const { logger, nodeId, nodeConfig } = ctx;

        type VarEntry = { id: string; key: string; value: string };
        const raw = nodeConfig.vars;

        let vars: Record<string, string>;
        if (Array.isArray(raw)) {
            vars = Object.fromEntries(
                (raw as VarEntry[]).filter((e) => e.key).map((e) => [e.key, e.value]),
            );
        } else {
            vars = (raw as Record<string, string> | undefined) ?? {};
        }

        const count = Object.keys(vars).length;

        if (count === 0) {
            await logger.info(nodeId, 'No variables defined, skipping');
            return { success: true, output: { vars: {} }, skipped: true };
        }

        await logger.info(nodeId, `Injecting ${count} environment variable(s) into the pipeline`);

        return {
            success: true,
            output: { vars },
        };
    }
}

export const setEnvVarsExecutor = new SetEnvVarsExecutor();
