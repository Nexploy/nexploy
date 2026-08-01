import crypto from 'crypto';
import dayjs from 'dayjs';
import { GitProviderAdapter, ParsedRepoUrl } from '@/services/git/core/GitProviderAdapter';
import { GitBranch, GitProviderToken, GitRepository } from '@workspace/typescript-interface/git/git';
import { MergeRequestAction, WebhookPayload } from '@workspace/typescript-interface/webhook';
import { tokenGitStorage } from '@/lib/storage/token-git-storage';
import { timingSafeEqual } from '@/lib/api/crypto-utils';
import { parseRepositoryUrl } from '@/services/git/core/repoUrl';
import { GIT_OAUTH_EXCHANGE_FAILED } from '@/services/git/providers/github/github.adapter';
import {
    BITBUCKET_WEB_URL,
    BitbucketRepo,
    bitbucketCloneUrl,
    bitbucketCreateTag,
    bitbucketCreateWebhook,
    bitbucketDeleteWebhook,
    bitbucketExchangeCodeForToken,
    bitbucketGetAuthenticatedUser,
    bitbucketGetBranchHead,
    bitbucketGetCommit,
    bitbucketGetRepository,
    bitbucketGetRepositoryBranches,
    bitbucketGetUserWorkspaces,
    bitbucketGetWorkspaceRepositories,
    bitbucketRefreshAccessToken,
    bitbucketUpdateCommitStatus,
} from './bitbucket.client';

function mapRepo(repo: BitbucketRepo): GitRepository {
    return {
        id: repo.uuid,
        name: repo.name,
        fullName: repo.full_name,
        url: bitbucketCloneUrl(repo.full_name),
        private: repo.is_private,
        defaultBranch: repo.mainbranch?.name ?? 'main',
    };
}

function splitFullName(fullName: string): { workspace: string; repoSlug: string } {
    const [workspace, repoSlug] = fullName.split('/');
    if (!workspace || !repoSlug) throw new Error(`Invalid repository name: ${fullName}`);
    return { workspace, repoSlug };
}

const BITBUCKET_PULL_REQUEST_ACTIONS: Record<string, MergeRequestAction | undefined> = {
    'pullrequest:created': 'opened',
    'pullrequest:updated': 'updated',
    'pullrequest:fulfilled': 'merged',
    'pullrequest:rejected': 'closed',
};

export const bitbucketAdapter: GitProviderAdapter = {
    type: 'BITBUCKET',
    cloneCredentialUsername: 'x-token-auth',
    webhookPath: '/api/webhooks/bitbucket',
    webhookEventHeader: 'x-event-key',

    parseRepoUrl(url: string): ParsedRepoUrl {
        return parseRepositoryUrl(url, { providerLabel: 'Bitbucket' });
    },

    async listRepositories({ token }): Promise<GitRepository[]> {
        const allRepos = await tokenGitStorage.run(token, async () => {
            const workspaces = await bitbucketGetUserWorkspaces();
            const results = await Promise.all(workspaces.map(bitbucketGetWorkspaceRepositories));
            return results.flat();
        });

        const seen = new Set<string>();
        return allRepos
            .filter((repo) => {
                if (seen.has(repo.uuid)) return false;
                seen.add(repo.uuid);
                return true;
            })
            .map(mapRepo);
    },

    async getRepository({ token, repositoryUrl }): Promise<GitRepository> {
        const { owner, repo } = this.parseRepoUrl(repositoryUrl);
        const repoData = await tokenGitStorage.run(token, async () => bitbucketGetRepository(owner, repo));
        return mapRepo(repoData);
    },

    async listBranches({ token, owner, repoName }): Promise<GitBranch[]> {
        const branches = await tokenGitStorage.run(token, async () =>
            bitbucketGetRepositoryBranches(owner!, repoName!),
        );
        return branches.map((branch) => ({
            name: branch.name,
            protected: false,
        }));
    },

    async getCommit({ token, repositoryUrl, branch, commitHash }) {
        try {
            const { owner, repo } = this.parseRepoUrl(repositoryUrl);
            return await tokenGitStorage.run(token, async () => {
                const commit = await bitbucketGetCommit(owner, repo, { branch, commitHash });
                if (!commit) return null;
                return { hash: commit.hash.substring(0, 8), message: commit.message };
            });
        } catch {
            return null;
        }
    },

    async getAuthenticatedUser({ token }) {
        const userData = await bitbucketGetAuthenticatedUser(token.accessToken ?? '');
        return { id: userData.uuid, username: userData.username ?? userData.nickname ?? null };
    },

    async createWebhook({ token, repo, webhookUrl, secret }): Promise<string> {
        const { workspace, repoSlug } = splitFullName(repo.fullName);
        const result = await tokenGitStorage.run(token, async () =>
            bitbucketCreateWebhook(workspace, repoSlug, webhookUrl, secret),
        );
        return result.uuid;
    },

    async deleteWebhook({ token, repo, webhookId }): Promise<void> {
        const { workspace, repoSlug } = splitFullName(repo.fullName);
        await tokenGitStorage.run(token, async () => bitbucketDeleteWebhook(workspace, repoSlug, webhookId));
    },

    parseWebhookPayload(body: any, event: string | null): WebhookPayload | null {
        const fullName = body.repository?.full_name;
        if (!fullName) return null;
        const repositoryUrl = bitbucketCloneUrl(fullName);

        const mergeRequestAction = event ? BITBUCKET_PULL_REQUEST_ACTIONS[event] : undefined;
        if (mergeRequestAction) {
            const pullRequest = body.pullrequest;
            if (!pullRequest?.source?.branch?.name) return null;
            if (pullRequest.source.repository?.full_name !== fullName) return null;

            return {
                event: 'merge_request',
                repositoryUrl,
                branch: pullRequest.source.branch.name,
                targetBranch: pullRequest.destination?.branch?.name,
                mergeRequestAction,
                commitHash: pullRequest.source.commit?.hash?.substring(0, 8),
                commitMessage: pullRequest.title,
            };
        }

        const changes: any[] = body.push?.changes ?? [];

        const tagChange = changes.find((entry) => entry?.new?.type === 'tag' && entry.new.name);
        if (tagChange) {
            return {
                event: 'tag',
                repositoryUrl,
                branch: tagChange.new.name,
                tagName: tagChange.new.name,
                commitHash: tagChange.new.target?.hash?.substring(0, 8),
                commitMessage: tagChange.new.target?.message,
            };
        }

        const branchChange = changes.find((entry) => entry?.new?.type === 'branch' && entry.new.name);
        if (!branchChange) return null;

        return {
            event: 'push',
            repositoryUrl,
            branch: branchChange.new.name,
            commitHash: branchChange.new.target?.hash?.substring(0, 8),
            commitMessage: branchChange.new.target?.message,
        };
    },

    verifyWebhookSignature({ headers, rawBody, secret }): boolean {
        const signature = headers.get('x-hub-signature');
        if (!signature) return false;
        const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
        return timingSafeEqual(signature, expected);
    },

    buildAuthorizeUrl({ credentials, state, redirectUri }): string {
        const params = new URLSearchParams({
            client_id: credentials.clientId,
            response_type: 'code',
            redirect_uri: redirectUri,
            state,
        });
        return `${BITBUCKET_WEB_URL}/site/oauth2/authorize?${params.toString()}`;
    },

    async exchangeCodeForToken({ code, credentials, redirectUri }) {
        const tokenData = await bitbucketExchangeCodeForToken(
            code,
            credentials.clientId,
            credentials.clientSecret,
            redirectUri,
        );
        if (tokenData.error || !tokenData.access_token) throw new Error(GIT_OAUTH_EXCHANGE_FAILED);

        const accessToken = tokenData.access_token;
        const refreshToken = tokenData.refresh_token ?? null;
        const accessTokenExpiresAt = tokenData.expires_in ? dayjs().add(tokenData.expires_in, 'second').toDate() : null;

        const user = await this.getAuthenticatedUser({
            token: { accessToken, refreshToken, accessTokenExpiresAt },
            baseUrl: BITBUCKET_WEB_URL,
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
        const { clientId, clientSecret } = credentials;
        if (!clientId || !clientSecret) {
            throw new Error('Bitbucket provider is not fully configured');
        }
        const data = await bitbucketRefreshAccessToken(refreshToken, clientId, clientSecret);
        if (data.error || !data.access_token) {
            throw new Error(data.error_description || data.error || 'Bitbucket token refresh failed');
        }
        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token ?? refreshToken,
            accessTokenExpiresAt: data.expires_in ? dayjs().add(data.expires_in, 'second').toDate() : null,
        };
    },

    async createRelease({ token, owner, repo, tagName, targetBranch }) {
        const commitHash = await bitbucketGetBranchHead(token, owner, repo, targetBranch);
        const tag = await bitbucketCreateTag(token, owner, repo, tagName, commitHash);
        return {
            releaseId: tag.name,
            releaseUrl: tag.links.html?.href ?? `${BITBUCKET_WEB_URL}/${owner}/${repo}/src/${tagName}`,
        };
    },

    async updateCommitStatus({ token, owner, repo, sha, state, description, context }) {
        await bitbucketUpdateCommitStatus(token, owner, repo, sha, state, {
            description,
            context,
        });
    },
};
