import crypto from 'crypto';
import dayjs from 'dayjs';
import { GitProviderAdapter, ParsedRepoUrl } from '@/services/git/core/GitProviderAdapter';
import { GitBranch, GitProviderToken, GitRepository } from '@workspace/typescript-interface/git/git';
import { WebhookPayload } from '@workspace/typescript-interface/webhook';
import { GithubRepo } from '@workspace/typescript-interface/git/repository/github.repository';
import { GithubBranch } from '@workspace/typescript-interface/git/branch/github.branch';
import { tokenGitStorage } from '@/lib/storage/token-git-storage';
import { timingSafeEqual } from '@/lib/api/crypto-utils';
import {
    githubCreateRelease,
    githubCreateWebhook,
    githubDeleteWebhook,
    githubExchangeCodeForToken,
    githubGetAuthenticatedUser,
    githubGetCommit,
    githubGetInstallationRepositories,
    githubGetRepository,
    githubGetRepositoryBranches,
    githubGetUserInstallations,
    githubRefreshAccessToken,
    githubRevokeGrant,
    githubUpdateCommitStatus,
} from './github.client';

export const GIT_OAUTH_EXCHANGE_FAILED = 'GIT_OAUTH_EXCHANGE_FAILED';

function mapRepo(repo: GithubRepo): GitRepository {
    return {
        id: `${repo.id}`,
        name: repo.name,
        fullName: repo.full_name,
        url: repo.clone_url,
        private: repo.private,
        defaultBranch: repo.default_branch,
    };
}

export const githubAdapter: GitProviderAdapter = {
    type: 'GITHUB',
    cloneCredentialUsername: 'x-access-token',
    webhookPath: '/api/webhooks/github',

    parseRepoUrl(url: string): ParsedRepoUrl {
        const match = url.match(/github\.com[\/:]([^\/]+)\/([^\/\.]+)/);
        if (match && match[1] && match[2]) {
            const owner = match[1];
            const repo = match[2].replace('.git', '');
            return { baseUrl: 'https://github.com', owner, repo, projectPath: `${owner}/${repo}` };
        }
        throw new Error(`Invalid GitHub repository URL: ${url}`);
    },

    async listRepositories({ token }): Promise<GitRepository[]> {
        const allRepos = await tokenGitStorage.run(token, async () => {
            const { installations } = await githubGetUserInstallations();
            const repoPromises = installations.map((inst) =>
                githubGetInstallationRepositories(inst.id).then((res) => res.repositories),
            );
            const results = await Promise.all(repoPromises);
            return results.flat();
        });

        const seen = new Set<string>();
        return allRepos
            .filter((repo) => {
                const id = `${repo.id}`;
                if (seen.has(id)) return false;
                seen.add(id);
                return true;
            })
            .map(mapRepo);
    },

    async getRepository({ token, repositoryUrl }): Promise<GitRepository> {
        const { owner, repo } = this.parseRepoUrl(repositoryUrl);
        const repoData = await tokenGitStorage.run(token, async () => githubGetRepository(owner, repo));
        return mapRepo(repoData);
    },

    async listBranches({ token, owner, repoName }): Promise<GitBranch[]> {
        const branches = await tokenGitStorage.run(token, async () =>
            githubGetRepositoryBranches(owner!, repoName!),
        );
        return branches.map((branch: GithubBranch) => ({
            name: branch.name,
            protected: branch.protected,
        }));
    },

    async getCommit({ token, repositoryUrl, branch, commitHash }) {
        try {
            const { owner, repo } = this.parseRepoUrl(repositoryUrl);
            const ref = commitHash || branch;
            return await tokenGitStorage.run(token, async () => {
                const commit = await githubGetCommit(`${owner}/${repo}`, ref);
                return {
                    hash: commit.sha.substring(0, 8),
                    message: commit.commit.message,
                };
            });
        } catch {
            return null;
        }
    },

    async getAuthenticatedUser({ token }) {
        const userData = await tokenGitStorage.run(token, async () => githubGetAuthenticatedUser());
        return { id: `${userData.id}`, username: userData.login };
    },

    async createWebhook({ token, repo, webhookUrl, secret }): Promise<string> {
        const [owner, repoName] = repo.fullName.split('/');
        if (!owner || !repoName) throw new Error(`Invalid repository name: ${repo.fullName}`);
        const result = await tokenGitStorage.run(token, async () =>
            githubCreateWebhook(owner, repoName, webhookUrl, secret),
        );
        return `${result.id}`;
    },

    async deleteWebhook({ token, repo, webhookId }): Promise<void> {
        const [owner, repoName] = repo.fullName.split('/');
        if (!owner || !repoName) throw new Error(`Invalid repository name: ${repo.fullName}`);
        await tokenGitStorage.run(token, async () =>
            githubDeleteWebhook(owner, repoName, webhookId),
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
        const signature = headers.get('x-hub-signature-256');
        if (!signature) return false;
        const expected =
            'sha256=' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
        return timingSafeEqual(signature, expected);
    },

    buildAuthorizeUrl({ credentials, state }): string {
        const params = new URLSearchParams({ state });
        return `${credentials.baseUrl}/apps/${credentials.appName}/installations/new?${params.toString()}`;
    },

    async exchangeCodeForToken({ code, credentials, redirectUri }) {
        const tokenData = await githubExchangeCodeForToken(
            code,
            credentials.clientId,
            credentials.clientSecret,
            redirectUri,
        );
        if (tokenData.error) throw new Error(GIT_OAUTH_EXCHANGE_FAILED);

        const accessToken = tokenData.access_token;
        const refreshToken = tokenData.refresh_token ?? null;
        const accessTokenExpiresAt = tokenData.expires_in
            ? dayjs().add(tokenData.expires_in, 'second').toDate()
            : null;

        const user = await this.getAuthenticatedUser({
            token: { accessToken, refreshToken, accessTokenExpiresAt },
            baseUrl: credentials.baseUrl ?? 'https://github.com',
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
        const data = await githubRefreshAccessToken(
            refreshToken,
            credentials.clientId,
            credentials.clientSecret,
        );
        if (data.error) {
            throw new Error(data.error_description || data.error);
        }
        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token ?? refreshToken,
            accessTokenExpiresAt: data.expires_in
                ? dayjs().add(data.expires_in, 'second').toDate()
                : null,
        };
    },

    async revokeToken({ token, credentials }): Promise<void> {
        if (!token.accessToken) return;
        await githubRevokeGrant(credentials.clientId, credentials.clientSecret, token.accessToken);
    },

    async createRelease({ token, owner, repo, tagName, targetBranch, title, notes, draft, prerelease }) {
        const result = await githubCreateRelease(token, owner, repo, {
            tagName,
            targetBranch,
            name: title,
            body: notes,
            draft,
            prerelease,
        });
        return { releaseId: `${result.id}`, releaseUrl: result.html_url };
    },

    async updateCommitStatus({ token, owner, repo, sha, state, description, context }) {
        await githubUpdateCommitStatus(token, owner, repo, sha, state, { description, context });
    },
};
