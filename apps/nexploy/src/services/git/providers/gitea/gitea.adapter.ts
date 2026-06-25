import crypto from 'crypto';
import dayjs from 'dayjs';
import { GitProviderAdapter, ParsedRepoUrl } from '@/services/git/core/GitProviderAdapter';
import { GitBranch, GitProviderToken, GitRepository } from '@workspace/typescript-interface/git/git';
import { WebhookPayload } from '@workspace/typescript-interface/webhook';
import { tokenGitStorage } from '@/lib/storage/token-git-storage';
import { timingSafeEqual } from '@/lib/api/crypto-utils';
import { GIT_OAUTH_EXCHANGE_FAILED } from '@/services/git/providers/github/github.adapter';
import {
    GiteaRepo,
    giteaCreateRelease,
    giteaCreateWebhook,
    giteaDeleteWebhook,
    giteaExchangeCodeForToken,
    giteaGetAuthenticatedUser,
    giteaGetCommits,
    giteaGetRepository,
    giteaGetRepositoryBranches,
    giteaGetUserRepositories,
    giteaRefreshAccessToken,
    giteaUpdateCommitStatus,
} from './gitea.client';

function mapRepo(repo: GiteaRepo): GitRepository {
    return {
        id: `${repo.id}`,
        name: repo.name,
        fullName: repo.full_name,
        url: repo.clone_url,
        private: repo.private,
        defaultBranch: repo.default_branch,
    };
}

export const giteaAdapter: GitProviderAdapter = {
    type: 'GITEA',
    cloneCredentialUsername: 'oauth2',
    webhookPath: '/api/webhooks/gitea',

    parseRepoUrl(url: string): ParsedRepoUrl {
        const parsed = new URL(url);
        const parts = parsed.pathname
            .replace(/\.git$/, '')
            .split('/')
            .filter(Boolean);
        if (parts.length < 2) throw new Error(`Invalid Gitea repository URL: ${url}`);
        const repo = parts[parts.length - 1]!;
        const owner = parts[parts.length - 2]!;
        return {
            baseUrl: `${parsed.protocol}//${parsed.host}`,
            owner,
            repo,
            projectPath: `${owner}/${repo}`,
        };
    },

    async listRepositories({ token, baseUrl }): Promise<GitRepository[]> {
        const repositories = await tokenGitStorage.run(token, async () =>
            giteaGetUserRepositories(baseUrl),
        );
        return repositories.map(mapRepo);
    },

    async getRepository({ token, baseUrl, repositoryUrl }): Promise<GitRepository> {
        const { owner, repo } = this.parseRepoUrl(repositoryUrl);
        const repoData = await tokenGitStorage.run(token, async () =>
            giteaGetRepository(baseUrl, owner, repo),
        );
        return mapRepo(repoData);
    },

    async listBranches({ token, baseUrl, owner, repoName }): Promise<GitBranch[]> {
        const branches = await tokenGitStorage.run(token, async () =>
            giteaGetRepositoryBranches(baseUrl, owner!, repoName!),
        );
        return branches.map((branch) => ({
            name: branch.name,
            protected: branch.protected,
        }));
    },

    async getCommit({ token, repositoryUrl, branch, commitHash }) {
        try {
            const { baseUrl, owner, repo } = this.parseRepoUrl(repositoryUrl);
            return await tokenGitStorage.run(token, async () => {
                const response = await giteaGetCommits(baseUrl, owner, repo, { branch, commitHash });
                const commit = Array.isArray(response) ? response[0] : response;
                if (!commit) return null;
                return { hash: commit.sha.substring(0, 8), message: commit.commit.message };
            });
        } catch {
            return null;
        }
    },

    async getAuthenticatedUser({ token, baseUrl }) {
        const userData = await giteaGetAuthenticatedUser(baseUrl, token.accessToken ?? '');
        return { id: `${userData.id}`, username: userData.login };
    },

    async createWebhook({ token, baseUrl, repo, webhookUrl, secret }): Promise<string> {
        const [owner, repoName] = repo.fullName.split('/');
        if (!owner || !repoName) throw new Error(`Invalid repository name: ${repo.fullName}`);
        const result = await tokenGitStorage.run(token, async () =>
            giteaCreateWebhook(baseUrl, owner, repoName, webhookUrl, secret),
        );
        return `${result.id}`;
    },

    async deleteWebhook({ token, baseUrl, repo, webhookId }): Promise<void> {
        const [owner, repoName] = repo.fullName.split('/');
        if (!owner || !repoName) throw new Error(`Invalid repository name: ${repo.fullName}`);
        await tokenGitStorage.run(token, async () =>
            giteaDeleteWebhook(baseUrl, owner, repoName, webhookId),
        );
    },

    parseWebhookPayload(body: any): WebhookPayload | null {
        if (!body.ref?.startsWith('refs/heads/')) {
            return null;
        }
        return {
            repositoryUrl: body.repository?.clone_url || body.repository?.html_url,
            branch: body.ref.replace('refs/heads/', ''),
            commitHash: body.head_commit?.id?.substring(0, 8),
            commitMessage: body.head_commit?.message,
        };
    },

    verifyWebhookSignature({ headers, rawBody, secret }): boolean {
        const signature = headers.get('x-gitea-signature');
        if (!signature) return false;
        const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
        return timingSafeEqual(signature, expected);
    },

    buildAuthorizeUrl({ credentials, state, redirectUri }): string {
        const params = new URLSearchParams({
            client_id: credentials.clientId,
            redirect_uri: redirectUri,
            response_type: 'code',
            state,
        });
        return `${credentials.baseUrl}/login/oauth/authorize?${params.toString()}`;
    },

    async exchangeCodeForToken({ code, credentials, redirectUri }) {
        const baseUrl = credentials.baseUrl!;
        const tokenData = await giteaExchangeCodeForToken(
            baseUrl,
            code,
            credentials.clientId,
            credentials.clientSecret,
            redirectUri,
        );
        if (tokenData.error || !tokenData.access_token) throw new Error(GIT_OAUTH_EXCHANGE_FAILED);

        const accessToken = tokenData.access_token;
        const refreshToken = tokenData.refresh_token ?? null;
        const accessTokenExpiresAt = tokenData.expires_in
            ? dayjs().add(tokenData.expires_in, 'second').toDate()
            : null;

        const user = await this.getAuthenticatedUser({
            token: { accessToken, refreshToken, accessTokenExpiresAt },
            baseUrl,
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
            throw new Error('Gitea provider is not fully configured');
        }
        const data = await giteaRefreshAccessToken(baseUrl, refreshToken, clientId, clientSecret);
        if (data.error || !data.access_token) {
            throw new Error(data.error || 'Gitea token refresh failed');
        }
        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token ?? refreshToken,
            accessTokenExpiresAt: data.expires_in
                ? dayjs().add(data.expires_in, 'second').toDate()
                : null,
        };
    },

    async createRelease({ token, baseUrl, owner, repo, tagName, targetBranch, title, notes, draft, prerelease }) {
        const result = await giteaCreateRelease(token, baseUrl, owner, repo, {
            tagName,
            targetBranch,
            name: title,
            body: notes,
            draft,
            prerelease,
        });
        return { releaseId: `${result.id}`, releaseUrl: result.html_url };
    },

    async updateCommitStatus({ token, baseUrl, owner, repo, sha, state, description, context }) {
        await giteaUpdateCommitStatus(token, baseUrl, owner, repo, sha, state, {
            description,
            context,
        });
    },
};
