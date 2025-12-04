import { prisma } from '@/../prisma/prisma';
import { getUserSession } from '@/services/auth/auth.service';
import { GetGitProviderToken, GitBranch, GitRepository } from '@workspace/typescript-interface/git';
import { GithubRepo } from '@workspace/typescript-interface/repository';
import { gitProviderService } from '@/services/api/gitProvider.service';

export async function getGitProviderToken(
    provider: string,
    requestedUserId?: string,
): Promise<GetGitProviderToken> {
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
    const token = await getGitProviderToken(provider);
    const accessToken = await gitProviderService.getValidToken(token, provider, userId);

    switch (provider) {
        case 'github': {
            const res = await fetch('https://api.github.com/user/repos', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    Accept: 'application/vnd.github+json',
                },
            });

            if (!res.ok) throw new Error('Failed to fetch GitHub repositories');

            const data = await res.json();
            return data.map((repo: GithubRepo) => ({
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
            const res = await fetch(
                'https://gitlab.com/api/v4/projects?membership=true&order_by=updated_at',
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                },
            );
            if (!res.ok) throw new Error('Failed to fetch GitLab repositories');

            const data = await res.json();
            return data.map((repo: any) => ({
                id: String(repo.id),
                name: repo.name,
                fullName: repo.path_with_namespace,
                url: repo.http_url_to_repo,
                private: repo.visibility === 'private',
                defaultBranch: repo.default_branch,
            }));
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
    const token = await getGitProviderToken(provider);
    const accessToken = await gitProviderService.getValidToken(token, provider, userId);

    if (provider === 'github') {
        if (!owner || !repoName) throw new Error('Owner and repo name required for GitHub');
        const res = await fetch(`https://api.github.com/repos/${owner}/${repoName}/branches`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: 'application/vnd.github+json',
            },
        });

        if (!res.ok) throw new Error('Failed to fetch GitHub branches');

        const data = await res.json();
        return data.map((branch: any) => ({
            name: branch.name,
            protected: branch.protected,
        }));
    } else {
        const res = await fetch(
            `https://gitlab.com/api/v4/projects/${repoId}/repository/branches`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            },
        );

        if (!res.ok) throw new Error('Failed to fetch GitLab branches');

        const data = await res.json();
        return data.map((branch: any) => ({
            name: branch.name,
            protected: branch.protected,
        }));
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
