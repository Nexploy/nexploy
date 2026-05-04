import { getFromClosestAncestor } from '@/helpers/pipeline.helpers';
import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '@/types/pipeline.type';
import { fetchSecretsDopplerConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { ResolveRefs } from '@workspace/schemas-zod/pipeline/nodeFieldRef.schema';
import { z } from 'zod';

export class FetchSecretsDopplerExecutor implements INodeExecutor {
    readonly type = 'fetch-secrets-doppler';
    readonly configSchema = fetchSecretsDopplerConfigSchema;

    async execute(
        ctx: NodeExecutionContext<ResolveRefs<z.infer<typeof fetchSecretsDopplerConfigSchema>>>,
    ): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId, abortSignal, edges } = ctx;

        const { serviceToken, project, config } = nodeConfig;

        await logger.info(nodeId, `Fetching secrets from Doppler`);

        const url = new URL('https://api.doppler.com/v3/configs/config/secrets/download');
        url.searchParams.set('format', 'json');
        if (project) url.searchParams.set('project', project);
        if (config) url.searchParams.set('config', config);

        const response = await fetch(url.toString(), {
            headers: {
                Authorization: `Bearer ${serviceToken}`,
                Accept: 'application/json',
            },
            signal: abortSignal,
        });

        if (!response.ok) {
            throw new Error(`Doppler returned ${response.status}: ${response.statusText}`);
        }

        const secrets = (await response.json()) as Record<string, string>;
        const count = Object.keys(secrets).length;
        await logger.info(nodeId, `Fetched ${count} secret(s) from Doppler`);

        const ancestorEnvs =
            getFromClosestAncestor<{ key: string; value: string }[]>(
                allOutputs,
                edges,
                nodeId,
                'envVariables',
            ) ?? [];
        const ancestorMap = Object.fromEntries(ancestorEnvs.map((e) => [e.key, e.value]));
        const merged = { ...ancestorMap, ...secrets };
        const envVariables = Object.entries(merged).map(([key, value]) => ({ key, value }));

        await logger.info(nodeId, `Injecting ${envVariables.length} secret(s) as environment variables`);
        return { output: { envVariables, secretCount: count } };
    }
}

export const fetchSecretsDopplerExecutor = new FetchSecretsDopplerExecutor();
