import { GitProviderType } from 'generated/client';
import { prisma } from '@/../prisma/prisma';
import { GitBranch, GitRepository } from '@workspace/typescript-interface/git/git';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';
import { getGitAdapter } from '@/services/git/core/registry';
import { getGitProviderCredentials } from '@/services/git/gitProviders.service';
import { getGitProviderToken, getValidToken } from '@/services/git/core/token.service';

const DEFAULT_BASE_URL: Record<GitProviderType, string> = {
    GITHUB: 'https://github.com',
    GITLAB: 'https://gitlab.com',
    GITEA: '',
};

async function resolveBaseUrl(provider: GitProviderType, gitAccountId?: string): Promise<string> {
    const credentials = await getGitProviderCredentials(provider, gitAccountId);
    return credentials?.baseUrl ?? DEFAULT_BASE_URL[provider];
}

export async function getRepositories(
    provider: GitProviderType,
    gitAccountId: string,
    userId: string,
): Promise<GitRepository[]> {
    const t = await getErrorTranslator();
    const oldToken = await getGitProviderToken(provider, { gitAccountId });
    const token = await getValidToken(oldToken, provider, userId, gitAccountId);
    const baseUrl = await resolveBaseUrl(provider, gitAccountId);

    const existingRepos = await prisma.repository.findMany({
        where: { userId, gitProvider: provider },
        select: { gitId: true },
    });
    const existingGitIds = new Set(existingRepos.map((r) => r.gitId));

    try {
        const repositories = await getGitAdapter(provider).listRepositories({ token, baseUrl });
        return repositories.filter((repo) => !existingGitIds.has(repo.id));
    } catch (error: unknown) {
        throw new Error(t('git.fetchReposFailed'));
    }
}

export async function getBranches(
    provider: GitProviderType,
    repoId: string,
    userId: string,
    gitAccountId: string,
    owner?: string,
    repoName?: string,
): Promise<GitBranch[]> {
    const t = await getErrorTranslator();
    const oldToken = await getGitProviderToken(provider, {
        gitAccountId,
        requestedUserId: userId,
    });
    const token = await getValidToken(oldToken, provider, userId, gitAccountId);
    const baseUrl = await resolveBaseUrl(provider, gitAccountId);

    try {
        return await getGitAdapter(provider).listBranches({
            token,
            baseUrl,
            repoId,
            owner,
            repoName,
        });
    } catch (error: unknown) {
        throw new Error(t('git.fetchBranchesFailed'));
    }
}

export async function verifyRepoAccessFromAccount(
    gitProvider: GitProviderType,
    gitId: string,
    repositoryUrl: string,
    gitAccountId: string,
    userId: string,
): Promise<GitRepository> {
    const oldToken = await getGitProviderToken(gitProvider, {
        gitAccountId,
        requestedUserId: userId,
    });
    const token = await getValidToken(oldToken, gitProvider, userId, gitAccountId);
    const baseUrl = await resolveBaseUrl(gitProvider, gitAccountId);

    let repoData: GitRepository;
    try {
        repoData = await getGitAdapter(gitProvider).getRepository({
            token,
            baseUrl,
            gitId,
            repositoryUrl,
        });
    } catch {
        throw new Error('REPO_NOT_ACCESSIBLE');
    }

    if (repoData.id !== gitId) {
        throw new Error('REPO_NOT_ACCESSIBLE');
    }

    return repoData;
}

export async function listGitAccounts(userId: string) {
    const t = await getErrorTranslator();
    try {
        return await prisma.gitAccount.findMany({
            where: { userId },
            select: {
                id: true,
                provider: true,
                providerAccountId: true,
                providerUsername: true,
                gitProviderId: true,
                createdAt: true,
                updatedAt: true,
                gitProvider: {
                    select: {
                        displayName: true,
                        ownerName: true,
                        ownerType: true,
                        baseUrl: true,
                    },
                },
            },
        });
    } catch (error: unknown) {
        throw new Error(t('git.listAccountsFailed'));
    }
}

export async function disconnectGitAccount(userId: string, gitProviderId: string) {
    const t = await getErrorTranslator();
    try {
        const gitAccount = await prisma.gitAccount.findUnique({
            where: {
                userId_gitProviderId: { userId, gitProviderId },
            },
        });

        if (!gitAccount) {
            throw new Error(t('git.gitAccountNotFound'));
        }

        const adapter = getGitAdapter(gitAccount.provider);
        const credentials = await getGitProviderCredentials(gitAccount.provider, gitAccount.id);
        if (adapter.revokeToken && credentials) {
            try {
                await adapter.revokeToken({
                    token: {
                        accessToken: gitAccount.accessToken,
                        refreshToken: gitAccount.refreshToken,
                        accessTokenExpiresAt: gitAccount.accessTokenExpiresAt,
                    },
                    credentials,
                });
            } catch {}
        }

        await prisma.gitAccount.delete({
            where: { id: gitAccount.id },
        });
    } catch (error: unknown) {
        throw new Error(t('git.disconnectFailed'));
    }
}
