import ky from 'ky';
import { getTokenGitStorage } from '@/lib/storage/token-git-storage';

export const BITBUCKET_WEB_URL = 'https://bitbucket.org';
const BITBUCKET_API_URL = 'https://api.bitbucket.org/2.0';
const PAGE_LIMIT = 100;
const MAX_PAGES = 20;

export interface BitbucketRepo {
    uuid: string;
    name: string;
    full_name: string;
    is_private: boolean;
    mainbranch?: { name: string };
}

export interface BitbucketBranch {
    name: string;
}

export interface BitbucketCommit {
    hash: string;
    message: string;
}

export interface BitbucketUser {
    uuid: string;
    username?: string;
    nickname?: string;
}

export interface BitbucketTokenResponse {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
}

interface BitbucketPage<T> {
    values: T[];
    next?: string;
}

export function kyBitbucket(explicitToken?: string) {
    return ky.create({
        prefixUrl: BITBUCKET_API_URL,
        hooks: {
            beforeRequest: [
                (request) => {
                    const accessToken = explicitToken ?? getTokenGitStorage().accessToken;
                    request.headers.set('Authorization', `Bearer ${accessToken}`);
                },
            ],
        },
    });
}

export function bitbucketCloneUrl(fullName: string): string {
    return `${BITBUCKET_WEB_URL}/${fullName}.git`;
}

async function fetchAllPages<T>(
    endpoint: string,
    searchParams: Record<string, string> = {},
    explicitToken?: string,
): Promise<T[]> {
    const accessToken = explicitToken ?? getTokenGitStorage().accessToken;
    const authHeaders = { Authorization: `Bearer ${accessToken}` };
    const results: T[] = [];

    let page = await ky
        .get(`${BITBUCKET_API_URL}/${endpoint}`, {
            headers: authHeaders,
            searchParams: { ...searchParams, pagelen: `${PAGE_LIMIT}` },
        })
        .json<BitbucketPage<T>>();
    results.push(...page.values);

    for (let visited = 1; visited < MAX_PAGES && page.next; visited++) {
        page = await ky.get(page.next, { headers: authHeaders }).json<BitbucketPage<T>>();
        results.push(...page.values);
    }

    return results;
}

export async function bitbucketGetUserWorkspaces(): Promise<string[]> {
    const memberships = await fetchAllPages<{ workspace: { slug: string } }>('user/workspaces');
    return memberships.map((membership) => membership.workspace.slug);
}

export async function bitbucketGetWorkspaceRepositories(
    workspace: string,
): Promise<BitbucketRepo[]> {
    return fetchAllPages<BitbucketRepo>(`repositories/${workspace}`, { sort: '-updated_on' });
}

export async function bitbucketGetRepository(
    workspace: string,
    repoSlug: string,
): Promise<BitbucketRepo> {
    return kyBitbucket().get(`repositories/${workspace}/${repoSlug}`).json<BitbucketRepo>();
}

export async function bitbucketGetRepositoryBranches(
    workspace: string,
    repoSlug: string,
): Promise<BitbucketBranch[]> {
    return fetchAllPages<BitbucketBranch>(`repositories/${workspace}/${repoSlug}/refs/branches`);
}

export async function bitbucketGetCommit(
    workspace: string,
    repoSlug: string,
    options: { branch?: string; commitHash?: string },
): Promise<BitbucketCommit | null> {
    if (options.commitHash) {
        return kyBitbucket()
            .get(`repositories/${workspace}/${repoSlug}/commit/${options.commitHash}`)
            .json<BitbucketCommit>();
    }

    const page = await kyBitbucket()
        .get(`repositories/${workspace}/${repoSlug}/commits`, {
            searchParams: { pagelen: '1', ...(options.branch && { include: options.branch }) },
        })
        .json<BitbucketPage<BitbucketCommit>>();

    return page.values[0] ?? null;
}

export async function bitbucketGetAuthenticatedUser(token: string): Promise<BitbucketUser> {
    return kyBitbucket(token).get('user').json<BitbucketUser>();
}

export async function bitbucketCreateWebhook(
    workspace: string,
    repoSlug: string,
    webhookUrl: string,
    secret: string,
): Promise<{ uuid: string }> {
    return kyBitbucket()
        .post(`repositories/${workspace}/${repoSlug}/hooks`, {
            json: {
                description: 'Nexploy',
                url: webhookUrl,
                active: true,
                secret,
                events: [
                    'repo:push',
                    'pullrequest:created',
                    'pullrequest:updated',
                    'pullrequest:fulfilled',
                    'pullrequest:rejected',
                ],
            },
        })
        .json<{ uuid: string }>();
}

export async function bitbucketDeleteWebhook(
    workspace: string,
    repoSlug: string,
    webhookId: string,
): Promise<void> {
    await kyBitbucket().delete(
        `repositories/${workspace}/${repoSlug}/hooks/${encodeURIComponent(webhookId)}`,
    );
}

export async function bitbucketGetBranchHead(
    token: string,
    workspace: string,
    repoSlug: string,
    branch: string,
): Promise<string> {
    const ref = await kyBitbucket(token)
        .get(`repositories/${workspace}/${repoSlug}/refs/branches/${encodeURIComponent(branch)}`)
        .json<{ target: { hash: string } }>();
    return ref.target.hash;
}

export async function bitbucketCreateTag(
    token: string,
    workspace: string,
    repoSlug: string,
    tagName: string,
    commitHash: string,
): Promise<{ name: string; links: { html?: { href: string } } }> {
    return kyBitbucket(token)
        .post(`repositories/${workspace}/${repoSlug}/refs/tags`, {
            json: { name: tagName, target: { hash: commitHash } },
        })
        .json<{ name: string; links: { html?: { href: string } } }>();
}

const BITBUCKET_STATE_MAP = {
    pending: 'INPROGRESS',
    success: 'SUCCESSFUL',
    failure: 'FAILED',
    error: 'FAILED',
} as const;

export async function bitbucketUpdateCommitStatus(
    token: string,
    workspace: string,
    repoSlug: string,
    sha: string,
    state: 'pending' | 'success' | 'failure' | 'error',
    options: { description?: string; context: string },
): Promise<void> {
    await kyBitbucket(token).post(`repositories/${workspace}/${repoSlug}/commit/${sha}/statuses/build`, {
        json: {
            key: options.context,
            name: options.context,
            state: BITBUCKET_STATE_MAP[state],
            ...(options.description && { description: options.description }),
        },
    });
}

async function requestToken(
    body: URLSearchParams,
    clientId: string,
    clientSecret: string,
): Promise<BitbucketTokenResponse> {
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    return ky
        .post(`${BITBUCKET_WEB_URL}/site/oauth2/access_token`, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Basic ${basicAuth}`,
            },
            body,
            throwHttpErrors: false,
        })
        .json<BitbucketTokenResponse>();
}

export async function bitbucketExchangeCodeForToken(
    code: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string,
): Promise<BitbucketTokenResponse> {
    return requestToken(
        new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
        }),
        clientId,
        clientSecret,
    );
}

export async function bitbucketRefreshAccessToken(
    refreshToken: string,
    clientId: string,
    clientSecret: string,
): Promise<BitbucketTokenResponse> {
    return requestToken(
        new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
        }),
        clientId,
        clientSecret,
    );
}
