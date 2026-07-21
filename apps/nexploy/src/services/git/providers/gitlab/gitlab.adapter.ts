import dayjs from 'dayjs';
import ky from 'ky';
import { GitProviderAdapter, ParsedRepoUrl } from '@/services/git/core/GitProviderAdapter';
import {
    GitBranch,
    GitLabCommit,
    GitProviderToken,
    GitRepository,
} from '@workspace/typescript-interface/git/git';
import { WebhookPayload } from '@workspace/typescript-interface/webhook';
import { GitlabRepo } from '@workspace/typescript-interface/git/repository/gitlab.repository';
import { GitlabBranch } from '@workspace/typescript-interface/git/branch/gitlab.branch';
import { tokenGitStorage } from '@/lib/storage/token-git-storage';
import { timingSafeEqual } from '@/lib/api/crypto-utils';
import {
    gitlabCreateRelease,
    gitlabCreateWebhook,
    gitlabDeleteWebhook,
    gitlabUpdateCommitStatus,
    kyGitlab,
} from './gitlab.client';
import { GIT_OAUTH_EXCHANGE_FAILED } from '@/services/git/providers/github/github.adapter';

function mapRepo(repo: GitlabRepo): GitRepository {
    return {
        id: `${repo.id}`,
        name: repo.name,
        fullName: repo.path_with_namespace,
        url: repo.http_url_to_repo,
        private: repo.visibility === 'private',
        defaultBranch: repo.default_branch,
    };
}

export const gitlabAdapter: GitProviderAdapter = {
    type: 'GITLAB',
    cloneCredentialUsername: 'oauth2',
    webhookPath: '/api/webhooks/gitlab',

    parseRepoUrl(url: string): ParsedRepoUrl {
        const parsed = new URL(url);
        const parts = parsed.pathname
            .replace(/\.git$/, '')
            .split('/')
            .filter(Boolean);
        if (parts.length < 2) throw new Error(`Invalid GitLab repository URL: ${url}`);
        const repo = parts[parts.length - 1]!;
        const owner = parts.slice(0, -1).join('/');
        return {
            baseUrl: `${parsed.protocol}//${parsed.host}`,
            owner,
            repo,
            projectPath: `${owner}/${repo}`,
        };
    },

    async listRepositories({ token, baseUrl }): Promise<GitRepository[]> {
        const repositories = await tokenGitStorage.run(token, async () =>
            kyGitlab(baseUrl)
                .get('v4/projects', {
                    searchParams: { membership: 'true', order_by: 'updated_at' },
                })
                .json<GitlabRepo[]>(),
        );
        return repositories.map(mapRepo);
    },

    async getRepository({ token, baseUrl, gitId }): Promise<GitRepository> {
        const repoData = await tokenGitStorage.run(token, async () =>
            kyGitlab(baseUrl).get(`v4/projects/${gitId}`).json<GitlabRepo>(),
        );
        return mapRepo(repoData);
    },

    async listBranches({ token, baseUrl, repoId }): Promise<GitBranch[]> {
        const branches = await tokenGitStorage.run(token, async () =>
            kyGitlab(baseUrl).get(`v4/projects/${repoId}/repository/branches`).json<GitlabBranch[]>(),
        );
        return branches.map((branch: GitlabBranch) => ({
            name: branch.name,
            protected: branch.protected,
        }));
    },

    async getCommit({ token, repositoryUrl, branch, commitHash }) {
        const { baseUrl, projectPath } = this.parseRepoUrl(repositoryUrl);
        const encodedProject = encodeURIComponent(projectPath);
        return tokenGitStorage.run(token, async () => {
            const endpoint = commitHash
                ? `v4/projects/${encodedProject}/repository/commits/${commitHash}`
                : `v4/projects/${encodedProject}/repository/commits`;
            const searchParams = commitHash ? undefined : { ref_name: branch, per_page: '1' };

            const response = await kyGitlab(baseUrl)
                .get(endpoint, { searchParams })
                .json<GitLabCommit | GitLabCommit[]>();

            const commit = Array.isArray(response) ? response[0] : response;
            if (!commit) return null;
            return { hash: commit.short_id, message: commit.message };
        });
    },

    async getAuthenticatedUser({ token, baseUrl }) {
        const userData = await kyGitlab(baseUrl, token.accessToken ?? undefined)
            .get('v4/user')
            .json<{ id: number; username: string }>();
        return { id: `${userData.id}`, username: userData.username };
    },

    async createWebhook({ token, baseUrl, repo, webhookUrl, secret }): Promise<string> {
        const result = await tokenGitStorage.run(token, async () =>
            gitlabCreateWebhook(baseUrl, repo.gitId, webhookUrl, secret),
        );
        return `${result.id}`;
    },

    async deleteWebhook({ token, baseUrl, repo, webhookId }): Promise<void> {
        await tokenGitStorage.run(token, async () =>
            gitlabDeleteWebhook(baseUrl, repo.gitId, webhookId),
        );
    },

    parseWebhookPayload(body: any): WebhookPayload | null {
        if (body.object_kind !== 'push' || !body.ref?.startsWith('refs/heads/')) {
            return null;
        }
        const lastCommit = body.commits?.[body.commits.length - 1];
        return {
            repositoryUrl: body.project?.git_http_url || body.project?.http_url,
            branch: body.ref.replace('refs/heads/', ''),
            commitHash: lastCommit?.id?.substring(0, 8),
            commitMessage: lastCommit?.message,
        };
    },

    verifyWebhookSignature({ headers, secret }): boolean {
        const token = headers.get('x-gitlab-token');
        if (!token) return false;
        return timingSafeEqual(token, secret);
    },

    buildAuthorizeUrl({ credentials, state, redirectUri }): string {
        const params = new URLSearchParams({
            client_id: credentials.clientId,
            redirect_uri: redirectUri,
            response_type: 'code',
            state,
            scope: 'api read_api read_repository',
        });
        return `${credentials.baseUrl}/oauth/authorize?${params.toString()}`;
    },

    async exchangeCodeForToken({ code, credentials, redirectUri }) {
        const baseUrl = credentials.baseUrl;
        const body = new URLSearchParams({
            client_id: credentials.clientId,
            client_secret: credentials.clientSecret,
            code,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri,
        });

        const tokenData = await ky
            .post(`${baseUrl}/oauth/token`, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body,
                throwHttpErrors: false,
            })
            .json<{
                error?: string;
                access_token: string;
                refresh_token?: string;
                expires_in?: number;
            }>();
        if (tokenData.error) throw new Error(GIT_OAUTH_EXCHANGE_FAILED);

        const accessToken = tokenData.access_token;
        const refreshToken = tokenData.refresh_token ?? null;
        const accessTokenExpiresAt = tokenData.expires_in
            ? dayjs().add(tokenData.expires_in, 'second').toDate()
            : null;

        const user = await this.getAuthenticatedUser({
            token: { accessToken, refreshToken, accessTokenExpiresAt },
            baseUrl: baseUrl!,
        });

        return {
            accessToken,
            refreshToken,
            accessTokenExpiresAt,
            providerAccountId: user.id,
            providerUsername: user.username,
        };
    },

    async refreshToken({ refreshToken, credentials }): Promise<GitProviderToken> {
        const { clientId, clientSecret, baseUrl } = credentials;
        if (!baseUrl || !clientId || !clientSecret) {
            throw new Error('GitLab provider is not fully configured');
        }
        const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        const body = new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
        });

        const response = await ky.post(`${baseUrl}/oauth/token`, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Basic ${basicAuth}`,
            },
            body,
            throwHttpErrors: false,
        });

        if (!response.ok) {
            const message = await response.text();
            throw new Error(`GitLab token refresh failed (${response.status}): ${message}`);
        }

        const data = (await response.json()) as {
            access_token: string;
            refresh_token?: string;
            expires_in?: number;
        };
        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token ?? refreshToken,
            accessTokenExpiresAt: data.expires_in
                ? dayjs().add(data.expires_in, 'second').toDate()
                : null,
        };
    },

    async createRelease({ token, baseUrl, owner, repo, tagName, targetBranch, title, notes }) {
        const result = await gitlabCreateRelease(token, baseUrl, owner, repo, {
            tagName,
            ref: targetBranch,
            name: title,
            description: notes,
        });
        return { releaseId: result.tag_name, releaseUrl: result._links.self };
    },

    async updateCommitStatus({ token, baseUrl, owner, repo, sha, state, description, context }) {
        await gitlabUpdateCommitStatus(token, baseUrl, owner, repo, sha, state, {
            description,
            context,
        });
    },
};
