import * as crypto from 'crypto';
import { prisma } from '../../../prisma/prisma';
import { decrypt } from '@/lib/encryption';
import { getGitAdapter } from '@/services/git/core/registry';
import { getGitProviderToken, getValidToken } from '@/services/git/core/token.service';
import { githubUpdateAppWebhookUrl } from '@/services/git/providers/github/github.client';
import { githubAdapter } from '@/services/git/providers/github/github.adapter';
import { buildRepositoryWebhookUrl, setupRepositoryWebhook } from './repoWebhook.service';

export interface WebhookPropagationFailure {
    repositoryId: string;
    repositoryName: string;
    error: string;
}

export interface WebhookPropagationSummary {
    updated: string[];
    recreated: string[];
    failures: WebhookPropagationFailure[];
    gitHubApp: 'updated' | 'absent' | 'failed';
    gitHubAppError?: string;
}

function base64Url(input: Buffer | string): string {
    return Buffer.from(input).toString('base64url');
}

function createGitHubAppJwt(appId: string, privateKeyPem: string): string {
    const issuedAt = Math.floor(Date.now() / 1000) - 60;
    const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const payload = base64Url(JSON.stringify({ iat: issuedAt, exp: issuedAt + 540, iss: appId }));
    const signature = crypto.sign('RSA-SHA256', Buffer.from(`${header}.${payload}`), privateKeyPem);

    return `${header}.${payload}.${base64Url(signature)}`;
}

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

async function updateGitHubAppWebhook(
    baseUrl: string,
): Promise<Pick<WebhookPropagationSummary, 'gitHubApp' | 'gitHubAppError'>> {
    const provider = await prisma.gitProvider.findFirst({
        where: { provider: 'GITHUB', appId: { not: null }, privateKey: { not: null } },
        select: { appId: true, privateKey: true },
    });

    if (!provider?.appId || !provider.privateKey) return { gitHubApp: 'absent' };

    try {
        const appJwt = createGitHubAppJwt(provider.appId, decrypt(provider.privateKey));
        await githubUpdateAppWebhookUrl(appJwt, `${baseUrl}${githubAdapter.webhookPath}`);
        return { gitHubApp: 'updated' };
    } catch (error) {
        return { gitHubApp: 'failed', gitHubAppError: errorMessage(error) };
    }
}

export async function propagateInstanceUrlToWebhooks(baseUrl: string): Promise<WebhookPropagationSummary> {
    const summary: WebhookPropagationSummary = {
        updated: [],
        recreated: [],
        failures: [],
        ...(await updateGitHubAppWebhook(baseUrl)),
    };

    const repositories = await prisma.repository.findMany({
        where: { webhookId: { not: null } },
        select: {
            id: true,
            name: true,
            gitId: true,
            gitProvider: true,
            gitAccountId: true,
            webhookId: true,
            gitAccount: { select: { userId: true, gitProvider: { select: { baseUrl: true } } } },
        },
    });

    for (const repository of repositories) {
        const tokenOwnerId = repository.gitAccount?.userId;

        try {
            const adapter = getGitAdapter(repository.gitProvider);

            if (!adapter.updateWebhookUrl) {
                await setupRepositoryWebhook(repository.id, baseUrl, { refresh: true });
                summary.recreated.push(repository.name);
                continue;
            }

            if (!repository.gitAccountId || !tokenOwnerId || !repository.webhookId) {
                throw new Error('Repository has no usable Git account');
            }

            const storedToken = await getGitProviderToken(repository.gitProvider, {
                gitAccountId: repository.gitAccountId,
                requestedUserId: tokenOwnerId,
            });
            const token = await getValidToken(
                storedToken,
                repository.gitProvider,
                tokenOwnerId,
                repository.gitAccountId,
            );

            await adapter.updateWebhookUrl({
                token,
                baseUrl: repository.gitAccount?.gitProvider?.baseUrl ?? '',
                repo: { gitId: repository.gitId, fullName: repository.name },
                webhookId: repository.webhookId,
                webhookUrl: buildRepositoryWebhookUrl(baseUrl, adapter.webhookPath, repository.id),
            });

            summary.updated.push(repository.name);
        } catch (error) {
            summary.failures.push({
                repositoryId: repository.id,
                repositoryName: repository.name,
                error: errorMessage(error),
            });
        }
    }

    return summary;
}
