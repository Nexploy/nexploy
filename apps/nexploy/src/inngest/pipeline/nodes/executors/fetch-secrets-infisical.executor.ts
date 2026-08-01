import ky, { HTTPError } from 'ky';
import { getFromClosestAncestor } from '@/helpers/pipeline.helpers';
import {
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
} from '@workspace/typescript-interface/pipeline/pipeline';
import { fetchSecretsInfisicalConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { ResolveRefs } from '@workspace/schemas-zod/pipeline/nodeFieldRef.schema';
import { z } from 'zod';

interface InfisicalSecret {
    secretKey: string;
    secretValue: string;
    secretValueHidden?: boolean;
}

interface InfisicalSecretsResponse {
    secrets?: InfisicalSecret[];
    imports?: { secrets?: InfisicalSecret[] }[];
}

const DEFAULT_SITE_URL = 'https://app.infisical.com';

export class FetchSecretsInfisicalExecutor implements INodeExecutor {
    readonly type = 'fetch-secrets-infisical';
    readonly configSchema = fetchSecretsInfisicalConfigSchema;

    async execute(
        ctx: NodeExecutionContext<ResolveRefs<z.infer<typeof fetchSecretsInfisicalConfigSchema>>>,
    ): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId, abortSignal, edges } = ctx;

        const {
            authMethod,
            clientId,
            clientSecret,
            accessToken,
            projectId,
            environment,
            secretPath,
            recursive,
            expandSecretReferences,
            includeImports,
        } = nodeConfig;

        const baseUrl = (nodeConfig.siteUrl?.trim() || DEFAULT_SITE_URL).replace(/\/+$/, '');
        const resolvedPath = secretPath.trim() || '/';

        const token =
            authMethod === 'universal-auth'
                ? await this.loginUniversalAuth(baseUrl, clientId, clientSecret, abortSignal, {
                      log: (message: string) => logger.info(nodeId, message),
                  })
                : accessToken.trim();

        await logger.info(nodeId, `Fetching secrets from Infisical (${environment} @ ${resolvedPath})`);

        const searchParams = {
            projectId: projectId.trim(),
            environment: environment.trim(),
            secretPath: resolvedPath,
            recursive: String(recursive),
            expandSecretReferences: String(expandSecretReferences),
            includeImports: String(includeImports),
            viewSecretValue: 'true',
        };

        const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' };

        let response: InfisicalSecretsResponse;
        try {
            response = await ky
                .get(`${baseUrl}/api/v4/secrets`, { headers, searchParams, signal: abortSignal })
                .json<InfisicalSecretsResponse>();
        } catch (error) {
            if (!(error instanceof HTTPError) || error.response.status !== 404) throw error;
            await logger.info(nodeId, 'Infisical API v4 unavailable, falling back to v3 raw secrets endpoint');
            response = await ky
                .get(`${baseUrl}/api/v3/secrets/raw`, {
                    headers,
                    searchParams: { ...searchParams, workspaceId: projectId.trim() },
                    signal: abortSignal,
                })
                .json<InfisicalSecretsResponse>();
        }

        const secrets: Record<string, string> = {};
        for (const imported of response.imports ?? []) {
            for (const secret of imported.secrets ?? []) {
                if (!secret.secretValueHidden) secrets[secret.secretKey] = secret.secretValue;
            }
        }
        for (const secret of response.secrets ?? []) {
            if (!secret.secretValueHidden) secrets[secret.secretKey] = secret.secretValue;
        }

        const count = Object.keys(secrets).length;
        await logger.info(nodeId, `Fetched ${count} secret(s) from Infisical`);

        const ancestorEnvs =
            getFromClosestAncestor<{ key: string; value: string }[]>(allOutputs, edges, nodeId, 'envVariables') ?? [];
        const ancestorMap = Object.fromEntries(ancestorEnvs.map((e) => [e.key, e.value]));
        const merged = { ...ancestorMap, ...secrets };
        const envVariables = Object.entries(merged).map(([key, value]) => ({ key, value }));

        await logger.info(nodeId, `Injecting ${envVariables.length} secret(s) as environment variables`);
        return { output: { envVariables, secretCount: count } };
    }

    private async loginUniversalAuth(
        baseUrl: string,
        clientId: string,
        clientSecret: string,
        abortSignal: AbortSignal,
        logger: { log: (message: string) => Promise<void> | void },
    ): Promise<string> {
        await logger.log('Authenticating with Infisical using Universal Auth');
        const { accessToken } = await ky
            .post(`${baseUrl}/api/v1/auth/universal-auth/login`, {
                json: { clientId: clientId.trim(), clientSecret: clientSecret.trim() },
                signal: abortSignal,
            })
            .json<{ accessToken: string }>();

        if (!accessToken) throw new Error('Infisical Universal Auth login returned no access token');
        return accessToken;
    }
}

export const fetchSecretsInfisicalExecutor = new FetchSecretsInfisicalExecutor();
