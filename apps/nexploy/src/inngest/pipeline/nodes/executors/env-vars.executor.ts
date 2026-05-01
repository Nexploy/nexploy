import { getFromClosestAncestor } from '@/helpers/pipeline.helpers';
import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '@/types/pipeline.type';
import { getAllEnvsBuild } from '@/services/repository/build.service';

export class EnvVarsExecutor implements INodeExecutor {
    readonly type = 'env-vars';

    async execute(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
        const { logger, nodeId, buildConfig, allOutputs, edges } = ctx;

        const repoEnvs = await getAllEnvsBuild(buildConfig.repositoryId);
        const repoMap = Object.fromEntries(repoEnvs.map((e) => [e.key, e.value]));

        const ancestorEnvs =
            getFromClosestAncestor<{ key: string; value: string }[]>(
                allOutputs,
                edges,
                nodeId,
                'envVariables',
            ) ?? [];
        const ancestorMap = Object.fromEntries(ancestorEnvs.map((e) => [e.key, e.value]));

        const merged = { ...repoMap, ...ancestorMap };
        const envVariables = Object.entries(merged).map(([key, value]) => ({ key, value }));

        if (envVariables.length === 0) {
            await logger.info(nodeId, 'No environment variables to inject');
            return { output: {}, skipped: true };
        }

        await logger.info(nodeId, `Injecting ${envVariables.length} environment variables`);

        return { output: { envVariables } };
    }
}

export const envVarsExecutor = new EnvVarsExecutor();
