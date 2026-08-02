import ky from 'ky';
import { getTokenGitStorage } from '@/lib/storage/token-git-storage';

export const AZURE_REPOS_WEB_URL = 'https://dev.azure.com';
export const AZURE_REPOS_VSSPS_URL = 'https://app.vssps.visualstudio.com';
export const AZURE_REPOS_RESOURCE_ID = '499b84ac-1321-427f-aa17-267ca6975798';
const API_VERSION = '7.1';
const PAGE_LIMIT = 500;
const MAX_PAGES = 20;

export interface AzureReposRepo {
    id: string;
    name: string;
    project: { id: string; name: string; visibility?: string };
    defaultBranch?: string;
    remoteUrl: string;
    webUrl?: string;
    isDisabled?: boolean;
}

export interface AzureReposRef {
    name: string;
    objectId: string;
}

export interface AzureReposCommit {
    commitId: string;
    comment: string;
}

export interface AzureReposProfile {
    id: string;
    displayName?: string;
    emailAddress?: string;
    publicAlias?: string;
}

export interface AzureReposAccount {
    accountId: string;
    accountName: string;
}

export interface AzureReposTokenResponse {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
}

interface AzureReposCollection<T> {
    count: number;
    value: T[];
}

function authHeaders(explicitToken?: string): Record<string, string> {
    const accessToken = explicitToken ?? getTokenGitStorage().accessToken;
    return { Authorization: `Bearer ${accessToken}` };
}

async function azureGet<T>(url: string, searchParams: Record<string, string> = {}, explicitToken?: string): Promise<T> {
    return ky
        .get(url, {
            headers: authHeaders(explicitToken),
            searchParams: { ...searchParams, 'api-version': API_VERSION },
        })
        .json<T>();
}

async function azureGetPage<T>(
    url: string,
    searchParams: Record<string, string> = {},
    explicitToken?: string,
): Promise<{ data: T; continuationToken: string | null }> {
    const response = await ky.get(url, {
        headers: authHeaders(explicitToken),
        searchParams: { ...searchParams, 'api-version': API_VERSION },
    });
    return {
        data: await response.json<T>(),
        continuationToken: response.headers.get('x-ms-continuationtoken'),
    };
}

async function azurePost<T>(
    url: string,
    json: unknown,
    explicitToken?: string,
    apiVersion: string = API_VERSION,
): Promise<T> {
    return ky
        .post(url, {
            headers: authHeaders(explicitToken),
            searchParams: { 'api-version': apiVersion },
            json,
        })
        .json<T>();
}

export function azureOrganizationUrl(organization: string): string {
    return `${AZURE_REPOS_WEB_URL}/${encodeURIComponent(organization)}`;
}

export function azureRepositoryApiUrl(organization: string, project: string, repository: string): string {
    return `${azureOrganizationUrl(organization)}/${encodeURIComponent(project)}/_apis/git/repositories/${encodeURIComponent(repository)}`;
}

export function azureCloneUrl(organization: string, project: string, repository: string): string {
    return `${azureOrganizationUrl(organization)}/${encodeURIComponent(project)}/_git/${encodeURIComponent(repository)}`;
}

export async function azureGetProfile(explicitToken?: string): Promise<AzureReposProfile> {
    return azureGet<AzureReposProfile>(`${AZURE_REPOS_VSSPS_URL}/_apis/profile/profiles/me`, {}, explicitToken);
}

export async function azureGetAccounts(memberId: string): Promise<AzureReposAccount[]> {
    const page = await azureGet<AzureReposCollection<AzureReposAccount>>(`${AZURE_REPOS_VSSPS_URL}/_apis/accounts`, {
        memberId,
    });
    return page.value ?? [];
}

export async function azureGetOrganizationRepositories(organization: string): Promise<AzureReposRepo[]> {
    const page = await azureGet<AzureReposCollection<AzureReposRepo>>(
        `${azureOrganizationUrl(organization)}/_apis/git/repositories`,
    );
    return (page.value ?? []).filter((repo) => !repo.isDisabled);
}

export async function azureGetRepository(
    organization: string,
    project: string,
    repository: string,
): Promise<AzureReposRepo> {
    return azureGet<AzureReposRepo>(azureRepositoryApiUrl(organization, project, repository));
}

export async function azureGetBranches(
    organization: string,
    project: string,
    repository: string,
): Promise<AzureReposRef[]> {
    const refs: AzureReposRef[] = [];
    let continuationToken: string | null = null;

    for (let visited = 0; visited < MAX_PAGES; visited++) {
        const page: {
            data: AzureReposCollection<AzureReposRef>;
            continuationToken: string | null;
        } = await azureGetPage<AzureReposCollection<AzureReposRef>>(
            `${azureRepositoryApiUrl(organization, project, repository)}/refs`,
            {
                filter: 'heads/',
                $top: `${PAGE_LIMIT}`,
                ...(continuationToken && { continuationToken }),
            },
        );
        refs.push(...(page.data.value ?? []));
        continuationToken = page.continuationToken;
        if (!continuationToken) break;
    }

    return refs;
}

export async function azureGetCommit(
    organization: string,
    project: string,
    repository: string,
    options: { branch?: string; commitHash?: string },
): Promise<AzureReposCommit | null> {
    const repositoryUrl = azureRepositoryApiUrl(organization, project, repository);

    if (options.commitHash) {
        return azureGet<AzureReposCommit>(`${repositoryUrl}/commits/${options.commitHash}`);
    }

    const page = await azureGet<AzureReposCollection<AzureReposCommit>>(`${repositoryUrl}/commits`, {
        $top: '1',
        ...(options.branch && { 'searchCriteria.itemVersion.version': options.branch }),
    });
    return page.value?.[0] ?? null;
}

export async function azureGetFileContent(
    organization: string,
    project: string,
    repository: string,
    path: string,
    branch: string,
    explicitToken?: string,
): Promise<string> {
    return ky
        .get(`${azureRepositoryApiUrl(organization, project, repository)}/items`, {
            headers: { ...authHeaders(explicitToken), Accept: 'text/plain' },
            searchParams: {
                path,
                'api-version': API_VERSION,
                'versionDescriptor.version': branch,
                'versionDescriptor.versionType': 'branch',
                includeContent: 'true',
                $format: 'text',
            },
        })
        .text();
}

export async function azureGetRootItems(
    organization: string,
    project: string,
    repository: string,
    branch: string,
): Promise<{ path: string; isFolder?: boolean }[]> {
    const listing = await azureGet<AzureReposCollection<{ path: string; isFolder?: boolean }>>(
        `${azureRepositoryApiUrl(organization, project, repository)}/items`,
        {
            scopePath: '/',
            recursionLevel: 'oneLevel',
            'versionDescriptor.version': branch,
            'versionDescriptor.versionType': 'branch',
        },
    );
    return listing.value ?? [];
}

export const AZURE_REPOS_WEBHOOK_EVENTS = [
    'git.push',
    'git.pullrequest.created',
    'git.pullrequest.updated',
    'git.pullrequest.merged',
] as const;

export async function azureCreateSubscriptions(
    organization: string,
    projectId: string,
    repositoryId: string,
    webhookUrl: string,
    buildHeaders: (eventType: string) => string,
): Promise<string[]> {
    const created = await Promise.all(
        AZURE_REPOS_WEBHOOK_EVENTS.map((eventType) =>
            azurePost<{ id: string }>(`${azureOrganizationUrl(organization)}/_apis/hooks/subscriptions`, {
                publisherId: 'tfs',
                eventType,
                resourceVersion: '1.0',
                consumerId: 'webHooks',
                consumerActionId: 'httpRequest',
                publisherInputs: {
                    projectId,
                    repository: repositoryId,
                },
                consumerInputs: {
                    url: webhookUrl,
                    httpHeaders: buildHeaders(eventType),
                    resourceDetailsToSend: 'all',
                },
            }),
        ),
    );
    return created.map((subscription) => subscription.id);
}

export async function azureDeleteSubscription(organization: string, subscriptionId: string): Promise<void> {
    await ky.delete(`${azureOrganizationUrl(organization)}/_apis/hooks/subscriptions/${subscriptionId}`, {
        headers: authHeaders(),
        searchParams: { 'api-version': API_VERSION },
    });
}

export async function azureGetBranchHead(
    token: string,
    organization: string,
    project: string,
    branch: string,
    repository: string,
): Promise<string> {
    const page = await azureGet<AzureReposCollection<AzureReposRef>>(
        `${azureRepositoryApiUrl(organization, project, repository)}/refs`,
        { filter: `heads/${branch}` },
        token,
    );
    const ref = page.value?.[0];
    if (!ref) throw new Error(`Branch "${branch}" not found on Azure Repos`);
    return ref.objectId;
}

export async function azureCreateAnnotatedTag(
    token: string,
    organization: string,
    project: string,
    repository: string,
    tagName: string,
    commitHash: string,
    message: string,
): Promise<{ name: string }> {
    return azurePost<{ name: string }>(
        `${azureRepositoryApiUrl(organization, project, repository)}/annotatedtags`,
        {
            name: tagName,
            taggedObject: { objectId: commitHash },
            message: message || tagName,
        },
        token,
    );
}

const AZURE_REPOS_STATE_MAP = {
    pending: 'pending',
    success: 'succeeded',
    failure: 'failed',
    error: 'error',
} as const;

export async function azureUpdateCommitStatus(
    token: string,
    organization: string,
    project: string,
    repository: string,
    commitHash: string,
    state: 'pending' | 'success' | 'failure' | 'error',
    options: { description?: string; context: string },
): Promise<void> {
    const [genre, name] = options.context.includes('/')
        ? [
              options.context.slice(0, options.context.lastIndexOf('/')),
              options.context.slice(options.context.lastIndexOf('/') + 1),
          ]
        : ['nexploy', options.context];

    await azurePost(
        `${azureRepositoryApiUrl(organization, project, repository)}/commits/${commitHash}/statuses`,
        {
            state: AZURE_REPOS_STATE_MAP[state],
            description: options.description || options.context,
            context: { name, genre },
        },
        token,
    );
}

function entraTokenUrl(tenantId?: string): string {
    return `https://login.microsoftonline.com/${tenantId || 'organizations'}/oauth2/v2.0/token`;
}

export function entraAuthorizeUrl(tenantId?: string): string {
    return `https://login.microsoftonline.com/${tenantId || 'organizations'}/oauth2/v2.0/authorize`;
}

export const AZURE_REPOS_OAUTH_SCOPE = `${AZURE_REPOS_RESOURCE_ID}/.default offline_access`;

async function requestToken(body: URLSearchParams, tenantId?: string): Promise<AzureReposTokenResponse> {
    return ky
        .post(entraTokenUrl(tenantId), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body,
            throwHttpErrors: false,
        })
        .json<AzureReposTokenResponse>();
}

export async function azureExchangeCodeForToken(
    code: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string,
    tenantId?: string,
): Promise<AzureReposTokenResponse> {
    return requestToken(
        new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: clientId,
            client_secret: clientSecret,
            code,
            redirect_uri: redirectUri,
            scope: AZURE_REPOS_OAUTH_SCOPE,
        }),
        tenantId,
    );
}

export async function azureRefreshAccessToken(
    refreshToken: string,
    clientId: string,
    clientSecret: string,
    tenantId?: string,
): Promise<AzureReposTokenResponse> {
    return requestToken(
        new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
            scope: AZURE_REPOS_OAUTH_SCOPE,
        }),
        tenantId,
    );
}
