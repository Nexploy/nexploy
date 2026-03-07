import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '@/types/pipeline.type';

export class SetEnvVarsExecutor implements INodeExecutor {
    readonly type = 'set-env-vars';

    async execute(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
        const { logger, nodeId, nodeConfig } = ctx;

        const vars = (nodeConfig.vars as Record<string, string> | undefined) ?? {};
        const count = Object.keys(vars).length;

        if (count === 0) {
            await logger.info(nodeId, 'No variables defined, skipping');
            return { success: true, output: { vars: {} }, skipped: true };
        }

        await logger.info(nodeId, `Injecting ${count} environment variable(s) into the pipeline`);

        for (const [key] of Object.entries(vars)) {
            await logger.debug(nodeId, `  → ${key}`);
        }

        // Output vars so downstream nodes (write-env-file, deploy-compose, etc.)
        // can merge them into their own env sets
        return {
            success: true,
            output: { vars },
        };
    }
}

export const setEnvVarsExecutor = new SetEnvVarsExecutor();
