import dayjs from 'dayjs';
import { GitProviderAdapter, ParsedRepoUrl } from '@/services/git/core/GitProviderAdapter';
import {
    GitBranch,
    GitProviderToken,
    GitRepository,
} from '@workspace/typescript-interface/git/git';
import { MergeRequestAction, WebhookPayload } from '@workspace/typescript-interface/webhook';
import { tokenGitStorage } from '@/lib/storage/token-git-storage';
import { timingSafeEqual } from '@/lib/api/crypto-utils';
import { parseRepositoryUrl } from '@/services/git/core/repoUrl';
import { GIT_OAUTH_EXCHANGE_FAILED } from '@/services/git/providers/github/github.adapter';
import {
    AZURE_REPOS_OAUTH_SCOPE,
    AZURE_REPOS_WEB_URL,
    AzureReposRepo,
    azureCloneUrl,
    azureCreateAnnotatedTag,
    azureCreateSubscriptions,
    azureDeleteSubscription,
    azureExchangeCodeForToken,
    azureGetAccounts,
    azureGetBranchHead,
    azureGetBranches,
    azureGetCommit,
    azureGetOrganizationRepositories,
    azureGetProfile,
    azureGetRepository,
    azureRefreshAccessToken,
    azureUpdateCommitStatus,
    entraAuthorizeUrl,
} from './azureRepos.client';

export const AZURE_REPOS_WEBHOOK_SECRET_HEADER = 'x-nexploy-token';
export const AZURE_REPOS_WEBHOOK_EVENT_HEADER = 'x-nexploy-azure-event';
const SUBSCRIPTION_ID_SEPARATOR = ',';

interface AzureReposLocation {
    organization: string;
    project: string;
    repository: string;
}

function mapRepo(organization: string, repo: AzureReposRepo): GitRepository {
    return {
        id: repo.id,
        name: repo.name,
        fullName: `${organization}/${repo.project.name}/${repo.name}`,
        url: azureCloneUrl(organization, repo.project.name, repo.name),
        private: repo.project.visibility !== 'public',
        defaultBranch: repo.defaultBranch?.replace('refs/heads/', '') ?? 'main',
    };
}

function splitFullName(fullName: string): AzureReposLocation {
    const [organization, project, ...rest] = fullName.split('/');
    const repository = rest.join('/');
    if (!organization || !project || !repository) {
        throw new Error(`Invalid Azure Repos repository name: ${fullName}`);
    }
    return { organization, project, repository };
}

function locationFromRepoUrl(url: string): AzureReposLocation {
    const { owner, repo } = azureReposAdapter.parseRepoUrl(url);
    return splitFullName(`${owner}/${repo}`);
}

function branchFromRef(ref: string): string {
    return ref.replace('refs/heads/', '');
}

const AZURE_PULL_REQUEST_ACTIONS: Record<string, MergeRequestAction | undefined> = {
    'git.pullrequest.created': 'opened',
    'git.pullrequest.updated': 'updated',
    'git.pullrequest.merged': 'merged',
};

export const azureReposAdapter: GitProviderAdapter = {
    type: 'AZURE_REPOS',
    cloneCredentialUsername: 'nexploy',
    webhookPath: '/api/webhooks/azure-repos',
    webhookEventHeader: AZURE_REPOS_WEBHOOK_EVENT_HEADER,

    parseRepoUrl(url: string): ParsedRepoUrl {
        return parseRepositoryUrl(url, {
            providerLabel: 'Azure Repos',
            nestedNamespace: true,
            ignoredSegments: ['_git', 'v3'],
        });
    },

    async listRepositories({ token }): Promise<GitRepository[]> {
        return tokenGitStorage.run(token, async () => {
            const profile = await azureGetProfile();
            const accounts = await azureGetAccounts(profile.id);

            const perOrganization = await Promise.all(
                accounts.map(async (account) => {
                    const repositories = await azureGetOrganizationRepositories(
                        account.accountName,
                    );
                    return repositories.map((repo) => mapRepo(account.accountName, repo));
                }),
            );

            return perOrganization.flat();
        });
    },

    async getRepository({ token, repositoryUrl }): Promise<GitRepository> {
        const { organization, project, repository } = locationFromRepoUrl(repositoryUrl);
        const repoData = await tokenGitStorage.run(token, async () =>
            azureGetRepository(organization, project, repository),
        );
        return mapRepo(organization, repoData);
    },

    async listBranches({ token, repositoryUrl, owner, repoName }): Promise<GitBranch[]> {
        const location = repositoryUrl
            ? locationFromRepoUrl(repositoryUrl)
            : splitFullName(`${owner}/${repoName}`);

        const refs = await tokenGitStorage.run(token, async () =>
            azureGetBranches(location.organization, location.project, location.repository),
        );

        return refs.map((ref) => ({
            name: branchFromRef(ref.name),
            protected: false,
        }));
    },

    async getCommit({ token, repositoryUrl, branch, commitHash }) {
        try {
            const { organization, project, repository } = locationFromRepoUrl(repositoryUrl);
            return await tokenGitStorage.run(token, async () => {
                const commit = await azureGetCommit(organization, project, repository, {
                    branch,
                    commitHash,
                });
                if (!commit) return null;
                return { hash: commit.commitId.substring(0, 8), message: commit.comment };
            });
        } catch {
            return null;
        }
    },

    async getAuthenticatedUser({ token }) {
        const profile = await azureGetProfile(token.accessToken ?? '');
        return {
            id: profile.id,
            username: profile.emailAddress ?? profile.displayName ?? profile.publicAlias ?? null,
        };
    },

    async createWebhook({ token, repo, webhookUrl, secret }): Promise<string> {
        const { organization, project, repository } = splitFullName(repo.fullName);
        const subscriptionIds = await tokenGitStorage.run(token, async () => {
            const repoData = await azureGetRepository(organization, project, repository);
            return azureCreateSubscriptions(
                organization,
                repoData.project.id,
                repoData.id,
                webhookUrl,
                (eventType) =>
                    `${AZURE_REPOS_WEBHOOK_SECRET_HEADER}:${secret}\n${AZURE_REPOS_WEBHOOK_EVENT_HEADER}:${eventType}`,
            );
        });
        return subscriptionIds.join(SUBSCRIPTION_ID_SEPARATOR);
    },

    async deleteWebhook({ token, repo, webhookId }): Promise<void> {
        const { organization } = splitFullName(repo.fullName);
        await tokenGitStorage.run(token, async () => {
            for (const subscriptionId of webhookId.split(SUBSCRIPTION_ID_SEPARATOR)) {
                if (!subscriptionId) continue;
                await azureDeleteSubscription(organization, subscriptionId);
            }
        });
    },

    parseWebhookPayload(body: any, event: string | null): WebhookPayload | null {
        const eventType: string | undefined = body.eventType ?? event ?? undefined;
        if (!eventType) return null;

        const mergeRequestAction = AZURE_PULL_REQUEST_ACTIONS[eventType];
        if (mergeRequestAction) {
            const pullRequest = body.resource;
            const repositoryUrl = pullRequest?.repository?.remoteUrl;
            if (!repositoryUrl || !pullRequest.sourceRefName) return null;

            return {
                event: 'merge_request',
                repositoryUrl,
                branch: branchFromRef(pullRequest.sourceRefName),
                targetBranch: branchFromRef(pullRequest.targetRefName ?? ''),
                mergeRequestAction:
                    pullRequest.status === 'completed' ? 'merged' : mergeRequestAction,
                commitHash: pullRequest.lastMergeSourceCommit?.commitId?.substring(0, 8),
                commitMessage: pullRequest.title,
            };
        }

        if (eventType !== 'git.push') return null;

        const repositoryUrl = body.resource?.repository?.remoteUrl;
        const refUpdate = body.resource?.refUpdates?.[0];
        if (!repositoryUrl || !refUpdate?.name) return null;
        if (/^0+$/.test(refUpdate.newObjectId ?? '')) return null;

        const lastCommit = body.resource?.commits?.[body.resource.commits.length - 1];

        if (refUpdate.name.startsWith('refs/tags/')) {
            const tagName = refUpdate.name.replace('refs/tags/', '');
            return {
                event: 'tag',
                repositoryUrl,
                branch: tagName,
                tagName,
                commitHash: (lastCommit?.commitId ?? refUpdate.newObjectId)?.substring(0, 8),
                commitMessage: lastCommit?.comment,
            };
        }

        if (!refUpdate.name.startsWith('refs/heads/')) return null;

        return {
            event: 'push',
            repositoryUrl,
            branch: branchFromRef(refUpdate.name),
            commitHash: (lastCommit?.commitId ?? refUpdate.newObjectId)?.substring(0, 8),
            commitMessage: lastCommit?.comment,
        };
    },

    verifyWebhookSignature({ headers, secret }): boolean {
        const token = headers.get(AZURE_REPOS_WEBHOOK_SECRET_HEADER);
        if (!token) return false;
        return timingSafeEqual(token, secret);
    },

    buildAuthorizeUrl({ credentials, state, redirectUri }): string {
        const params = new URLSearchParams({
            client_id: credentials.clientId,
            response_type: 'code',
            redirect_uri: redirectUri,
            response_mode: 'query',
            scope: AZURE_REPOS_OAUTH_SCOPE,
            state,
        });
        return `${entraAuthorizeUrl(credentials.tenantId)}?${params.toString()}`;
    },

    async exchangeCodeForToken({ code, credentials, redirectUri }) {
        const tokenData = await azureExchangeCodeForToken(
            code,
            credentials.clientId,
            credentials.clientSecret,
            redirectUri,
            credentials.tenantId,
        );
        if (tokenData.error || !tokenData.access_token) throw new Error(GIT_OAUTH_EXCHANGE_FAILED);

        const accessToken = tokenData.access_token;
        const refreshToken = tokenData.refresh_token ?? null;
        const accessTokenExpiresAt = tokenData.expires_in
            ? dayjs().add(tokenData.expires_in, 'second').toDate()
            : null;

        const user = await this.getAuthenticatedUser({
            token: { accessToken, refreshToken, accessTokenExpiresAt },
            baseUrl: AZURE_REPOS_WEB_URL,
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
        const { clientId, clientSecret, tenantId } = credentials;
        if (!clientId || !clientSecret) {
            throw new Error('Azure Repos provider is not fully configured');
        }
        const data = await azureRefreshAccessToken(refreshToken, clientId, clientSecret, tenantId);
        if (data.error || !data.access_token) {
            throw new Error(
                data.error_description || data.error || 'Azure Repos token refresh failed',
            );
        }
        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token ?? refreshToken,
            accessTokenExpiresAt: data.expires_in
                ? dayjs().add(data.expires_in, 'second').toDate()
                : null,
        };
    },

    async createRelease({ token, owner, repo, tagName, targetBranch, notes }) {
        const { organization, project, repository } = splitFullName(`${owner}/${repo}`);
        const commitHash = await azureGetBranchHead(
            token,
            organization,
            project,
            targetBranch,
            repository,
        );
        const tag = await azureCreateAnnotatedTag(
            token,
            organization,
            project,
            repository,
            tagName,
            commitHash,
            notes,
        );
        return {
            releaseId: tag.name,
            releaseUrl: `${azureCloneUrl(organization, project, repository)}?version=GT${encodeURIComponent(tagName)}`,
        };
    },

    async updateCommitStatus({ token, owner, repo, sha, state, description, context }) {
        const { organization, project, repository } = splitFullName(`${owner}/${repo}`);
        await azureUpdateCommitStatus(token, organization, project, repository, sha, state, {
            description,
            context,
        });
    },
};
