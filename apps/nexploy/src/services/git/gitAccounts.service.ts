import { GitProviderType } from 'generated/client';
import { prisma } from '@/../prisma/prisma';
import { GitBranch, GitRepository, GitRepositoryList } from '@workspace/typescript-interface/git/git';
import { decrypt } from '@/lib/encryption';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';
import { getGitAdapter } from '@/services/git/core/registry';
import { getGitProviderCredentials } from '@/services/git/gitProviders.service';
import { getGitProviderToken, getValidToken } from '@/services/git/core/token.service';

const DEFAULT_BASE_URL: Record<GitProviderType, string> = {
    GITHUB: 'https://github.com',
    GITLAB: 'https://gitlab.com',
    GITEA: '',
    BITBUCKET: 'https://bitbucket.org',
    AZURE_REPOS: 'https://dev.azure.com',
    CUSTOM: '',
};

async function resolveBaseUrl(provider: GitProviderType, gitAccountId?: string): Promise<string> {
    const credentials = await getGitProviderCredentials(provider, gitAccountId);
    return credentials?.baseUrl ?? DEFAULT_BASE_URL[provider];
}

export async function getRepositories(
    provider: GitProviderType,
    gitAccountId: string,
    userId: string,
    organizationId: string,
): Promise<GitRepositoryList> {
    const t = await getErrorTranslator();
    const oldToken = await getGitProviderToken(provider, { gitAccountId });
    const token = await getValidToken(oldToken, provider, userId, gitAccountId);
    const baseUrl = await resolveBaseUrl(provider, gitAccountId);

    const existingRepos = await prisma.repository.findMany({
        where: { organizationId, gitProvider: provider },
        select: { gitId: true },
    });
    const existingGitIds = new Set(existingRepos.map((r) => r.gitId));

    try {
        const repositories = await getGitAdapter(provider).listRepositories({ token, baseUrl });
        const available = repositories.filter((repo) => !existingGitIds.has(repo.id));

        return {
            repositories: available,
            totalCount: repositories.length,
            alreadyAddedCount: repositories.length - available.length,
        };
    } catch (error: unknown) {
        throw new Error(t('git.fetchReposFailed'));
    }
}

export async function inspectCustomRepository(
    repositoryUrl: string,
): Promise<GitRepository & { branches: GitBranch[] }> {
    const adapter = getGitAdapter('CUSTOM');

    const repository = await adapter.getRepository({
        token: { accessToken: null, refreshToken: null, accessTokenExpiresAt: null },
        baseUrl: '',
        gitId: repositoryUrl,
        repositoryUrl,
    });

    const branches = await adapter.listBranches({
        token: { accessToken: null, refreshToken: null, accessTokenExpiresAt: null },
        baseUrl: '',
        repoId: repository.id,
        repositoryUrl,
    });

    return { ...repository, branches };
}

export async function getBranches(
    provider: GitProviderType,
    repoId: string,
    userId: string,
    gitAccountId: string,
    owner?: string,
    repoName?: string,
    repositoryUrl?: string,
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
            repositoryUrl,
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
                        accessToken: decrypt(gitAccount.accessToken),
                        refreshToken: gitAccount.refreshToken ? decrypt(gitAccount.refreshToken) : null,
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
