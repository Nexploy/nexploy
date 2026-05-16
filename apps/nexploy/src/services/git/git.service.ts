import { prisma } from '@/../prisma/prisma';
import { getUserSession } from '@/services/auth/auth.service';
import { GitBranch, GitProviderToken, GitRepository, } from '@workspace/typescript-interface/git/git';
import { getValidToken } from '@/services/api/gitProvider.service';
import { tokenGitStorage } from '@/lib/storage/token-git-storage';
import { kyGitlab } from '@/lib/api/kyGitlab';
import { getGitProviderCredentialsByAccountId } from '@/services/oauthProvider.service';
import { GitlabRepo } from '@workspace/typescript-interface/git/repository/gitlab.repository';
import { GitlabBranch } from '@workspace/typescript-interface/git/branch/gitlab.branch';
import { GithubBranch } from '@workspace/typescript-interface/git/branch/github.branch';
import { GithubRepo } from '@workspace/typescript-interface/git/repository/github.repository';
import { decrypt, encrypt } from '@/lib/encryption';
import {
    githubGetInstallationRepositories,
    githubGetRepository,
    githubGetRepositoryBranches,
    githubGetUserInstallations,
} from '@/lib/api/github.api';

export function extractGitHubRepo(repositoryUrl: string): { owner: string; repo: string } {
    const match = repositoryUrl.match(/github\.com[\/:]([^\/]+)\/([^\/\.]+)/);
    if (match && match[1] && match[2]) {
        return { owner: match[1], repo: match[2].replace('.git', '') };
    }
    throw new Error(`Invalid GitHub repository URL: ${repositoryUrl}`);
}

export function extractGitLabRepo(repositoryUrl: string): {
    baseUrl: string;
    owner: string;
    repo: string;
} {
    const url = new URL(repositoryUrl);
    const parts = url.pathname
        .replace(/\.git$/, '')
        .split('/')
        .filter(Boolean);
    if (parts.length < 2) throw new Error(`Invalid GitLab repository URL: ${repositoryUrl}`);
    const repo = parts[parts.length - 1]!;
    const owner = parts.slice(0, -1).join('/');
    return { baseUrl: `${url.protocol}//${url.host}`, owner, repo };
}

export async function getGitProviderToken(
    provider: string,
    { gitAccountId, requestedUserId }: { gitAccountId?: string; requestedUserId?: string } = {},
): Promise<GitProviderToken> {
    const userId = requestedUserId ?? (await getUserSession())?.user.id;
    if (!userId) throw new Error('Unauthorized');

    const gitAccount = await prisma.gitAccount.findFirst({
        where: {
            userId,
            provider,
            ...(gitAccountId && { id: gitAccountId }),
        },
        select: {
            accessToken: true,
            accessTokenExpiresAt: true,
            refreshToken: true,
        },
    });

    if (!gitAccount?.accessToken) {
        throw new Error(`No access token found for ${provider}`);
    }

    return {
        accessToken: decrypt(gitAccount.accessToken),
        refreshToken: gitAccount.refreshToken ? decrypt(gitAccount.refreshToken) : null,
        accessTokenExpiresAt: gitAccount.accessTokenExpiresAt,
    };
}

export async function getRepositories(
    provider: string,
    gitAccountId: string,
    userId: string,
): Promise<GitRepository[]> {
    const oldToken = await getGitProviderToken(provider, { gitAccountId });
    const token = await getValidToken(oldToken, provider, userId, gitAccountId);

    const existingRepos = await prisma.repository.findMany({
        where: { userId, gitProvider: provider },
        select: { gitId: true },
    });
    const existingGitIds = new Set(existingRepos.map((r) => r.gitId));

    switch (provider) {
        case 'github': {
            const allRepos = await tokenGitStorage.run(token, async () => {
                const { installations } = await githubGetUserInstallations();

                const repoPromises = installations.map((inst) =>
                    githubGetInstallationRepositories(inst.id).then((res) => res.repositories),
                );

                const results = await Promise.all(repoPromises);
                return results.flat();
            });

            const seen = new Set<string>();
            const repositories = allRepos.filter((repo) => {
                const id = String(repo.id);
                if (seen.has(id)) return false;
                seen.add(id);
                return true;
            });

            return repositories
                .filter((repo: GithubRepo) => !existingGitIds.has(String(repo.id)))
                .map((repo: GithubRepo) => ({
                    id: String(repo.id),
                    name: repo.name,
                    fullName: repo.full_name,
                    url: repo.clone_url,
                    private: repo.private,
                    visibility: repo.visibility,
                    defaultBranch: repo.default_branch,
                }));
        }
        case 'gitlab': {
            try {
                const gitlabCreds = await getGitProviderCredentialsByAccountId(gitAccountId);
                const gitlabBaseUrl = gitlabCreds?.baseUrl ?? 'https://gitlab.com';

                const repositories = await tokenGitStorage.run(token, async () => {
                    return await kyGitlab(gitlabBaseUrl)
                        .get('v4/projects', {
                            searchParams: {
                                membership: 'true',
                                order_by: 'updated_at',
                            },
                        })
                        .json<GitlabRepo[]>();
                });

                return repositories
                    .filter((repo: GitlabRepo) => !existingGitIds.has(String(repo.id)))
                    .map((repo: GitlabRepo) => ({
                        id: String(repo.id),
                        name: repo.name,
                        fullName: repo.path_with_namespace,
                        url: repo.http_url_to_repo,
                        private: repo.visibility === 'private',
                        defaultBranch: repo.default_branch,
                    }));
            } catch (error: unknown) {
                throw new Error('Failed to fetch GitLab repositories');
            }
        }
        default:
            throw new Error(`Unsupported provider: ${provider}`);
    }
}

export async function getBranches(
    provider: 'github' | 'gitlab',
    repoId: string,
    userId: string,
    gitAccountId: string,
    owner?: string,
    repoName?: string,
): Promise<GitBranch[]> {
    const oldToken = await getGitProviderToken(provider, {
        gitAccountId,
        requestedUserId: userId,
    });
    const token = await getValidToken(oldToken, provider, userId, gitAccountId);

    switch (provider) {
        case 'github': {
            try {
                const branches = await tokenGitStorage.run(token, async () => {
                    return await githubGetRepositoryBranches(owner!, repoName!);
                });

                return branches.map((branch: GithubBranch) => ({
                    name: branch.name,
                    protected: branch.protected,
                }));
            } catch (error: unknown) {
                throw new Error('Failed to fetch GitHub branches');
            }
        }
        case 'gitlab': {
            try {
                const gitlabCreds = await getGitProviderCredentialsByAccountId(gitAccountId);
                const gitlabBaseUrl = gitlabCreds?.baseUrl ?? 'https://gitlab.com';

                const branches = await tokenGitStorage.run(token, async () => {
                    return await kyGitlab(gitlabBaseUrl)
                        .get(`v4/projects/${repoId}/repository/branches`)
                        .json<GitlabBranch[]>();
                });

                return branches.map((branch: GitlabBranch) => ({
                    name: branch.name,
                    protected: branch.protected,
                }));
            } catch (error: unknown) {
                throw new Error('Failed to fetch GitLab branches');
            }
        }
        default:
            throw new Error(`Unsupported provider: ${provider}`);
    }
}

export async function updateGitProviderToken(
    provider: string,
    userId: string,
    tokenData: GitProviderToken,
    gitAccountId?: string,
): Promise<void> {
    try {
        const gitAccount = await prisma.gitAccount.findFirst({
            where: {
                provider,
                userId,
                ...(gitAccountId && { id: gitAccountId }),
            },
        });

        if (!gitAccount) throw new Error(`No ${provider} account found for user`);

        await prisma.gitAccount.update({
            where: {
                id: gitAccount.id,
            },
            data: {
                accessToken: tokenData.accessToken ? encrypt(tokenData.accessToken) : undefined,
                refreshToken: tokenData.refreshToken ? encrypt(tokenData.refreshToken) : null,
                accessTokenExpiresAt: tokenData.accessTokenExpiresAt,
            },
        });
    } catch (error: unknown) {
        throw new Error('Failed to update git provider token');
    }
}

export async function listGitAccounts(userId: string) {
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
        throw new Error('Failed to list git accounts');
    }
}

export async function verifyRepoAccessFromAccount(
    gitProvider: string,
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

    switch (gitProvider) {
        case 'github': {
            const { owner, repo } = extractGitHubRepo(repositoryUrl);
            try {
                const repoData = await tokenGitStorage.run(token, async () => {
                    return await githubGetRepository(owner, repo);
                });
                if (String(repoData.id) !== gitId) {
                    throw new Error('REPO_NOT_ACCESSIBLE');
                }
                return {
                    id: String(repoData.id),
                    name: repoData.name,
                    fullName: repoData.full_name,
                    url: repoData.clone_url,
                    private: repoData.private,
                    defaultBranch: repoData.default_branch,
                };
            } catch (error: unknown) {
                const msg = error instanceof Error ? error.message : '';
                if (msg === 'REPO_NOT_ACCESSIBLE') throw error;
                throw new Error('REPO_NOT_ACCESSIBLE');
            }
        }
        case 'gitlab': {
            const gitlabCreds = await getGitProviderCredentialsByAccountId(gitAccountId);
            const gitlabBaseUrl = gitlabCreds?.baseUrl ?? 'https://gitlab.com';
            try {
                const repoData = await tokenGitStorage.run(token, async () => {
                    return await kyGitlab(gitlabBaseUrl)
                        .get(`v4/projects/${gitId}`)
                        .json<GitlabRepo>();
                });
                return {
                    id: String(repoData.id),
                    name: repoData.name,
                    fullName: repoData.path_with_namespace,
                    url: repoData.http_url_to_repo,
                    private: repoData.visibility === 'private',
                    defaultBranch: repoData.default_branch,
                };
            } catch {
                throw new Error('REPO_NOT_ACCESSIBLE');
            }
        }
        default:
            throw new Error(`Unsupported provider: ${gitProvider}`);
    }
}

export async function disconnectGitAccount(userId: string, gitProviderId: string) {
    try {
        const gitAccount = await prisma.gitAccount.findUnique({
            where: {
                userId_gitProviderId: { userId, gitProviderId },
            },
        });

        if (!gitAccount) {
            throw new Error('Git account not found');
        }

        await prisma.gitAccount.delete({
            where: { id: gitAccount.id },
        });
    } catch (error: unknown) {
        throw new Error('Failed to disconnect git account');
    }
}
