import {
    getFromAllOutputs,
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
} from '@/types/pipeline.type';

export class EnvVarsExecutor implements INodeExecutor {
    readonly type = 'env-vars';

    async execute(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
        const { buildConfig, allOutputs, logger, nodeId } = ctx;

        const fromBuild = buildConfig.envVariables ?? {};
        const existing =
            getFromAllOutputs<Record<string, string>>(allOutputs, 'envVariables') ?? {};

        const envVariables = { ...fromBuild, ...existing };

        const envCount = Object.keys(envVariables).length;

        if (envCount === 0) {
            await logger.info(nodeId, 'No environment variables to inject');
            return { output: {}, skipped: true };
        }

        await logger.info(nodeId, `Injecting ${envCount} environment variables`);

        return { output: { envVariables } };
    }
}

export const envVarsExecutor = new EnvVarsExecutor();
