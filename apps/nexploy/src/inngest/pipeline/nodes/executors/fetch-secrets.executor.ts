import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { INodeExecutor, NodeExecutionContext, NodeExecutionResult, getFromAllOutputs } from '@/types/pipeline.type';

export class FetchSecretsExecutor implements INodeExecutor {
    readonly type = 'fetch-secrets';

    async execute(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId, abortSignal } = ctx;

        const provider = nodeConfig.provider as string;
        const endpoint = nodeConfig.endpoint as string | undefined;
        const token = nodeConfig.token as string;
        const secretPath = nodeConfig.secretPath as string;
        const outputAs = (nodeConfig.outputAs as string | undefined) ?? 'env-vars';

        if (!provider) throw new Error('Provider is required');
        if (!token) throw new Error('Token is required');
        if (!secretPath) throw new Error('Secret path is required');

        const workDir = getFromAllOutputs<string>(allOutputs, 'workDir');

        await logger.info(nodeId, `Fetching secrets from ${provider} at path: ${secretPath}`);

        let secrets: Record<string, string> = {};

        if (provider === 'vault') {
            if (!endpoint) throw new Error('Vault endpoint is required');
            const vaultUrl = `${endpoint.replace(/\/$/, '')}/v1/${secretPath}`;
            const response = await fetch(vaultUrl, {
                headers: { 'X-Vault-Token': token },
                signal: abortSignal,
            });
            if (!response.ok) {
                throw new Error(`Vault returned ${response.status}: ${response.statusText}`);
            }
            const data = await response.json() as { data?: { data?: Record<string, string>; [k: string]: unknown } };
            // Support both KV v1 and v2
            secrets = (data?.data?.data ?? data?.data ?? {}) as Record<string, string>;

        } else if (provider === 'doppler') {
            const dopplerUrl = `https://api.doppler.com/v3/configs/config/secrets/download?format=json`;
            const response = await fetch(dopplerUrl, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                },
                signal: abortSignal,
            });
            if (!response.ok) {
                throw new Error(`Doppler returned ${response.status}: ${response.statusText}`);
            }
            secrets = await response.json() as Record<string, string>;

        } else if (provider === 'env-file') {
            // secretPath is a path to a .env file, token is unused (set to placeholder)
            const filePath = path.isAbsolute(secretPath)
                ? secretPath
                : path.join(workDir ?? process.cwd(), secretPath);
            const content = await fs.readFile(filePath, 'utf-8');
            for (const line of content.split('\n')) {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith('#')) continue;
                const eqIdx = trimmed.indexOf('=');
                if (eqIdx > 0) {
                    const key = trimmed.slice(0, eqIdx).trim();
                    const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
                    secrets[key] = value;
                }
            }
        } else {
            throw new Error(`Unsupported secrets provider: ${provider}`);
        }

        const count = Object.keys(secrets).length;
        await logger.info(nodeId, `Fetched ${count} secret(s) from ${provider}`);

        if (outputAs === 'env-vars') {
            // Return secrets as pipeline outputs so downstream nodes can use them
            return {
                success: true,
                output: {
                    secretCount: count,
                    provider,
                    ...secrets,
                },
            };
        } else {
            // Write secrets as a JSON file to workDir
            if (!workDir) throw new Error('No workDir found — run a clone node first');
            const outputFile = path.join(workDir, 'secrets.json');
            await fs.writeFile(outputFile, JSON.stringify(secrets, null, 2), 'utf-8');
            await logger.info(nodeId, `Secrets written to secrets.json (${count} entries)`);
            return {
                success: true,
                output: { secretCount: count, provider, secretsFile: outputFile },
            };
        }
    }
}

export const fetchSecretsExecutor = new FetchSecretsExecutor();
