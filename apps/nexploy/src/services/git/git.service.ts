import { prisma } from '@/../prisma/prisma';
import { getUserSession } from '@/services/auth/auth.service';
import { GitBranch, GitRepository, ProvidersGit } from '@workspace/typescript-interface/git';
import { GithubRepo } from '@workspace/typescript-interface/repository';

export async function getGitProviderToken(provider: ProvidersGit) {
    const session = await getUserSession();
    if (!session?.user) throw new Error('Unauthorized');

    const account = await prisma.account.findFirst({
        where: {
            userId: session.user.id,
            providerId: provider,
        },
        select: {
            accessToken: true,
        },
    });

    if (!account?.accessToken) {
        throw new Error(`No access token found for ${provider}`);
    }

    return account.accessToken;
}

export async function getRepositories(provider: ProvidersGit): Promise<GitRepository[]> {
    const token = await getGitProviderToken(provider);

    switch (provider) {
        case 'github': {
            const res = await fetch('https://api.github.com/user/repos', {
                headers: {
                    Authorization: `Bearer ${token}`,
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
                'https://gitlab.com/api/v4/projects?membership=true&order_by=updated_at&per_page=100',
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
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
    owner?: string,
    repoName?: string,
): Promise<GitBranch[]> {
    const token = await getGitProviderToken(provider);

    if (provider === 'github') {
        if (!owner || !repoName) throw new Error('Owner and repo name required for GitHub');
        const res = await fetch(`https://api.github.com/repos/${owner}/${repoName}/branches`, {
            headers: {
                Authorization: `Bearer ${token}`,
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
        // GitLab
        const res = await fetch(
            `https://gitlab.com/api/v4/projects/${repoId}/repository/branches`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
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
