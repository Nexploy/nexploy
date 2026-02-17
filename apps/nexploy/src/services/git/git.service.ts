import { prisma } from '@/../prisma/prisma';
import { getUserSession } from '@/services/auth/auth.service';
import {
    GitBranch,
    GitProviderToken,
    GitRepository,
} from '@workspace/typescript-interface/git/git';
import { getValidToken } from '@/services/api/gitProvider.service';
import { kyGithub } from '@/lib/api/kyGithub';
import { tokenGitStorage } from '@/lib/storage/token-git-storage';
import { kyGitlab } from '@/lib/api/kyGitlab';
import { GithubRepo } from '@workspace/typescript-interface/git/repository/github.repository';
import { GitlabRepo } from '@workspace/typescript-interface/git/repository/gitlab.repository';
import { GitlabBranch } from '@workspace/typescript-interface/git/branch/gitlab.branch';
import { GithubBranch } from '@workspace/typescript-interface/git/branch/github.branch';
import { decrypt, encrypt } from '@/lib/encryption';

export function extractGitHubRepo(repositoryUrl: string): { owner: string; repo: string } {
    const match = repositoryUrl.match(/github\.com[\/:]([^\/]+)\/([^\/\.]+)/);
    if (match && match[1] && match[2]) {
        return { owner: match[1], repo: match[2].replace('.git', '') };
    }
    throw new Error(`Invalid GitHub repository URL: ${repositoryUrl}`);
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
    const token = await getValidToken(oldToken, provider, userId);

    switch (provider) {
        case 'github': {
            const allRepos = await tokenGitStorage.run(token, async () => {
                const installationsRes = await kyGithub
                    .get('user/installations', {
                        headers: { Accept: 'application/vnd.github+json' },
                    })
                    .json<{ installations: { id: number }[] }>();

                const repoPromises = installationsRes.installations.map((inst) =>
                    kyGithub
                        .get(`user/installations/${inst.id}/repositories`, {
                            headers: { Accept: 'application/vnd.github+json' },
                            searchParams: { per_page: '100' },
                        })
                        .json<{ repositories: GithubRepo[] }>()
                        .then((res) => res.repositories),
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

            return repositories.map((repo: GithubRepo) => ({
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
                const repositories = await tokenGitStorage.run(token, async () => {
                    return await kyGitlab
                        .get('v4/projects', {
                            searchParams: {
                                membership: 'true',
                                order_by: 'updated_at',
                            },
                        })
                        .json<GitlabRepo[]>();
                });

                return repositories.map((repo: GitlabRepo) => ({
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
    const token = await getValidToken(oldToken, provider, userId);

    switch (provider) {
        case 'github': {
            try {
                const branchs = await tokenGitStorage.run(token, async () => {
                    return await kyGithub
                        .get(`repos/${owner}/${repoName}/branches`, {
                            headers: {
                                Accept: 'application/vnd.github+json',
                            },
                        })
                        .json<GithubBranch[]>();
                });

                return branchs.map((branch: GithubBranch) => ({
                    name: branch.name,
                    protected: branch.protected,
                }));
            } catch (error: unknown) {
                throw new Error('Failed to fetch GitHub branches');
            }
        }
        case 'gitlab': {
            try {
                const branchs = await tokenGitStorage.run(token, async () => {
                    return await kyGitlab
                        .get(`v4/projects/${repoId}/repository/branches`)
                        .json<GitlabBranch[]>();
                });

                return branchs.map((branch: GitlabBranch) => ({
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
): Promise<void> {
    try {
        const gitAccount = await prisma.gitAccount.findFirst({
            where: {
                provider,
                userId,
            },
        });

        if (!gitAccount) throw new Error(`No ${provider} account found for user`);

        await prisma.gitAccount.update({
            where: {
                id: gitAccount.id,
            },
            data: {
                accessToken: encrypt(tokenData.accessToken),
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
                    },
                },
            },
        });
    } catch (error: unknown) {
        throw new Error('Failed to list git accounts');
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
