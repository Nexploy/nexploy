import ky from 'ky';
import { getFromClosestAncestor } from '@/helpers/pipeline.helpers';
import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '@workspace/typescript-interface/pipeline/pipeline';
import { fetchSecretsVaultConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { ResolveRefs } from '@workspace/schemas-zod/pipeline/nodeFieldRef.schema';
import { z } from 'zod';

export class FetchSecretsVaultExecutor implements INodeExecutor {
    readonly type = 'fetch-secrets-vault';
    readonly configSchema = fetchSecretsVaultConfigSchema;

    async execute(
        ctx: NodeExecutionContext<ResolveRefs<z.infer<typeof fetchSecretsVaultConfigSchema>>>,
    ): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId, abortSignal, edges } = ctx;

        const { endpoint, token, secretPath, kvVersion, namespace } = nodeConfig;

        await logger.info(
            nodeId,
            `Fetching secrets from HashiCorp Vault (KV ${kvVersion}) at path: ${secretPath}`,
        );

        const nsPrefix = namespace ? `${namespace}/` : '';
        const base = `${endpoint.replace(/\/$/, '')}/v1/${nsPrefix}`;

        const vaultUrl =
            kvVersion === 'v2'
                ? (() => {
                      const slashIdx = secretPath.indexOf('/');
                      if (slashIdx === -1) return `${base}${secretPath}/data/`;
                      const mount = secretPath.slice(0, slashIdx);
                      const rest = secretPath.slice(slashIdx + 1);
                      return `${base}${mount}/data/${rest}`;
                  })()
                : `${base}${secretPath}`;

        const headers: Record<string, string> = { 'X-Vault-Token': token };
        if (namespace) headers['X-Vault-Namespace'] = namespace;

        const data = await ky.get(vaultUrl, { headers, signal: abortSignal }).json<{
            data?: { data?: Record<string, string>; [k: string]: unknown };
        }>();

        const secrets: Record<string, string> =
            kvVersion === 'v2'
                ? ((data?.data?.data ?? {}) as Record<string, string>)
                : ((data?.data ?? {}) as Record<string, string>);

        const count = Object.keys(secrets).length;
        await logger.info(nodeId, `Fetched ${count} secret(s) from Vault`);

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

        await logger.info(
            nodeId,
            `Injecting ${envVariables.length} secret(s) as environment variables`,
        );
        return { output: { envVariables, secretCount: count } };
    }
}

export const fetchSecretsVaultExecutor = new FetchSecretsVaultExecutor();
