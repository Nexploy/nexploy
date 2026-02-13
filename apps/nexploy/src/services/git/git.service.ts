import { prisma } from '@/../prisma/prisma';
import { getUserSession } from '@/services/auth/auth.service';
import {
    GitBranch,
    GitProviderToken,
    GitRepository,
} from '@workspace/typescript-interface/git/git';
import { getValidToken } from '@/services/api/gitProvider.service';
import { kyGithub } from '@/lib/api/drinoGithub';
import { tokenGitStorage } from '@/lib/storage/token-git-storage';
import { kyGitlab } from '@/lib/api/drinoGitlab';
import { GithubRepo } from '@workspace/typescript-interface/git/repository/github.repository';
import { GitlabRepo } from '@workspace/typescript-interface/git/repository/gitlab.repository';
import { GitlabBranch } from '@workspace/typescript-interface/git/branch/gitlab.branch';
import { GithubBranch } from '@workspace/typescript-interface/git/branch/github.branch';

export function extractGitHubRepo(repositoryUrl: string): { owner: string; repo: string } {
    const match = repositoryUrl.match(/github\.com[\/:]([^\/]+)\/([^\/\.]+)/);
    if (match && match[1] && match[2]) {
        return { owner: match[1], repo: match[2].replace('.git', '') };
    }
    throw new Error(`Invalid GitHub repository URL: ${repositoryUrl}`);
}

export async function getGitProviderToken(
    provider: string,
    requestedUserId?: string,
): Promise<GitProviderToken> {
    const userId = requestedUserId ?? (await getUserSession())?.user.id;
    if (!userId) throw new Error('Unauthorized');

    const tokens = await prisma.account.findFirst({
        where: {
            userId,
            providerId: provider,
        },
        select: {
            accessToken: true,
            accessTokenExpiresAt: true,
            refreshToken: true,
        },
    });

    if (!tokens?.accessToken) {
        throw new Error(`No access token found for ${provider}`);
    }

    return tokens;
}

export async function getRepositories(provider: string, userId: string): Promise<GitRepository[]> {
    const oldToken = await getGitProviderToken(provider);
    const token = await getValidToken(oldToken, provider, userId);

    switch (provider) {
        case 'github': {
            const repositories = await tokenGitStorage.run(token, async () => {
                return await kyGithub
                    .get('user/repos', {
                        headers: {
                            Accept: 'application/vnd.github+json',
                        },
                    })
                    .json<GithubRepo[]>();
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
    owner?: string,
    repoName?: string,
): Promise<GitBranch[]> {
    const oldToken = await getGitProviderToken(provider);
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
    tokenData: {
        accessToken: string;
        refreshToken?: string;
        accessTokenExpiresAt: Date | null;
    },
): Promise<void> {
    try {
        const account = await prisma.account.findFirst({
            where: {
                providerId: provider,
                userId,
            },
        });

        if (!account) throw new Error(`No ${provider} account found for user`);

        await prisma.account.update({
            where: {
                id: account.id,
            },
            data: {
                accessToken: tokenData.accessToken,
                refreshToken: tokenData.refreshToken,
                accessTokenExpiresAt: tokenData.accessTokenExpiresAt,
            },
        });
    } catch (error: unknown) {
        throw new Error('Failed to update git provider token');
    }
}
