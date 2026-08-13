import dayjs from 'dayjs';
import ky from 'ky';
import { GitProviderAdapter, ParsedRepoUrl } from '@/services/git/core/GitProviderAdapter';
import { GitBranch, GitLabCommit, GitProviderToken, GitRepository } from '@workspace/typescript-interface/git/git';
import { MergeRequestAction, WebhookPayload } from '@workspace/typescript-interface/webhook';
import { GitlabRepo } from '@workspace/typescript-interface/git/repository/gitlab.repository';
import { GitlabBranch } from '@workspace/typescript-interface/git/branch/gitlab.branch';
import { tokenGitStorage } from '@/lib/storage/token-git-storage';
import { timingSafeEqual } from '@/lib/api/crypto-utils';
import {
    gitlabCreateRelease,
    gitlabCreateWebhook,
    gitlabDeleteWebhook,
    gitlabFetchAllPages,
    gitlabRevokeToken,
    gitlabUpdateCommitStatus,
    kyGitlab,
} from './gitlab.client';
import { parseRepositoryUrl } from '@/services/git/core/repoUrl';
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

const GITLAB_MERGE_REQUEST_ACTIONS: Record<string, MergeRequestAction | undefined> = {
    open: 'opened',
    reopen: 'opened',
    update: 'updated',
    merge: 'merged',
    close: 'closed',
};

export const gitlabAdapter: GitProviderAdapter = {
    type: 'GITLAB',
    cloneCredentialUsername: 'oauth2',
    webhookPath: '/api/webhooks/gitlab',
    webhookEventHeader: 'x-gitlab-event',

    parseRepoUrl(url: string): ParsedRepoUrl {
        return parseRepositoryUrl(url, { providerLabel: 'GitLab', nestedNamespace: true });
    },

    async listRepositories({ token, baseUrl }): Promise<GitRepository[]> {
        const repositories = await tokenGitStorage.run(token, async () =>
            gitlabFetchAllPages<GitlabRepo>(baseUrl, 'v4/projects', {
                membership: 'true',
                order_by: 'updated_at',
            }),
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
            gitlabFetchAllPages<GitlabBranch>(baseUrl, `v4/projects/${repoId}/repository/branches`),
        );
        return branches.map((branch: GitlabBranch) => ({
            name: branch.name,
            protected: branch.protected,
        }));
    },

    async getCommit({ token, repositoryUrl, branch, commitHash }) {
        try {
            const { baseUrl, projectPath } = this.parseRepoUrl(repositoryUrl);
            const encodedProject = encodeURIComponent(projectPath);
            return await tokenGitStorage.run(token, async () => {
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
        } catch {
            return null;
        }
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
        await tokenGitStorage.run(token, async () => gitlabDeleteWebhook(baseUrl, repo.gitId, webhookId));
    },

    parseWebhookPayload(body: any): WebhookPayload | null {
        const repositoryUrl = body.project?.git_http_url || body.project?.http_url;
        if (!repositoryUrl) return null;

        if (body.object_kind === 'merge_request') {
            const attributes = body.object_attributes;
            const action = GITLAB_MERGE_REQUEST_ACTIONS[attributes?.action as string];
            if (!attributes || !action) return null;
            if (attributes.source_project_id && attributes.source_project_id !== attributes.target_project_id) {
                return null;
            }

            return {
                event: 'merge_request',
                repositoryUrl,
                branch: attributes.source_branch,
                targetBranch: attributes.target_branch,
                mergeRequestAction: action,
                commitHash: attributes.last_commit?.id?.substring(0, 8),
                commitMessage: attributes.last_commit?.message,
            };
        }

        if (body.object_kind === 'tag_push') {
            if (!body.ref?.startsWith('refs/tags/')) return null;
            if (body.after && /^0+$/.test(body.after)) return null;

            const tagName = body.ref.replace('refs/tags/', '');
            const lastCommit = body.commits?.[body.commits.length - 1];
            return {
                event: 'tag',
                repositoryUrl,
                branch: tagName,
                tagName,
                commitHash: (lastCommit?.id ?? body.checkout_sha)?.substring(0, 8),
                commitMessage: lastCommit?.message,
            };
        }

        if (body.object_kind !== 'push' || !body.ref?.startsWith('refs/heads/')) {
            return null;
        }

        if (body.after && /^0+$/.test(body.after)) return null;

        const lastCommit = body.commits?.[body.commits.length - 1];
        return {
            event: 'push',
            repositoryUrl,
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
        const accessTokenExpiresAt = tokenData.expires_in ? dayjs().add(tokenData.expires_in, 'second').toDate() : null;

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
            accessTokenExpiresAt: data.expires_in ? dayjs().add(data.expires_in, 'second').toDate() : null,
        };
    },

    async revokeToken({ token, credentials }): Promise<void> {
        const { clientId, clientSecret, baseUrl } = credentials;
        if (!token.accessToken || !baseUrl || !clientId || !clientSecret) return;
        await gitlabRevokeToken(baseUrl, token.accessToken, clientId, clientSecret);
        if (token.refreshToken) {
            await gitlabRevokeToken(baseUrl, token.refreshToken, clientId, clientSecret);
        }
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
