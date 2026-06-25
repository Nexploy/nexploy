import { GitProviderType } from 'generated/client';
import {
    GitBranch,
    GitProviderToken,
    GitRepository,
} from '@workspace/typescript-interface/git/git';
import { WebhookPayload } from '@workspace/typescript-interface/webhook';

export interface ParsedRepoUrl {
    baseUrl: string;
    owner: string;
    repo: string;
    projectPath: string;
}

export interface OAuthExchangeResult {
    accessToken: string;
    refreshToken: string | null;
    accessTokenExpiresAt: Date | null;
    providerAccountId: string;
    providerUsername: string | null;
}

export interface AdapterCredentials {
    clientId: string;
    clientSecret: string;
    privateKey?: string;
    appId?: string;
    appName?: string;
    baseUrl?: string;
}

export interface WebhookRepoRef {
    gitId: string;
    fullName: string;
}

export interface CommitStatusArgs {
    token: string;
    baseUrl: string;
    owner: string;
    repo: string;
    sha: string;
    state: 'pending' | 'success' | 'failure' | 'error';
    description?: string;
    context: string;
}

export interface CreateReleaseArgs {
    token: string;
    baseUrl: string;
    owner: string;
    repo: string;
    tagName: string;
    targetBranch: string;
    title: string;
    notes: string;
    draft: boolean;
    prerelease: boolean;
}

export interface GitProviderAdapter {
    readonly type: GitProviderType;
    readonly cloneCredentialUsername: string;
    readonly webhookPath: string;

    parseRepoUrl(url: string): ParsedRepoUrl;

    listRepositories(args: {
        token: GitProviderToken;
        baseUrl: string;
    }): Promise<GitRepository[]>;

    getRepository(args: {
        token: GitProviderToken;
        baseUrl: string;
        gitId: string;
        repositoryUrl: string;
    }): Promise<GitRepository>;

    listBranches(args: {
        token: GitProviderToken;
        baseUrl: string;
        repoId: string;
        owner?: string;
        repoName?: string;
    }): Promise<GitBranch[]>;

    getCommit(args: {
        token: GitProviderToken;
        baseUrl: string;
        repositoryUrl: string;
        branch: string;
        commitHash?: string;
    }): Promise<{ hash: string; message: string } | null>;

    getAuthenticatedUser(args: {
        token: GitProviderToken;
        baseUrl: string;
    }): Promise<{ id: string; username: string | null }>;

    createWebhook(args: {
        token: GitProviderToken;
        baseUrl: string;
        repo: WebhookRepoRef;
        webhookUrl: string;
        secret: string;
    }): Promise<string>;

    deleteWebhook(args: {
        token: GitProviderToken;
        baseUrl: string;
        repo: WebhookRepoRef;
        webhookId: string;
    }): Promise<void>;

    parseWebhookPayload(body: unknown): WebhookPayload | null;

    verifyWebhookSignature(args: {
        headers: Headers;
        rawBody: string;
        secret: string;
    }): boolean;

    buildAuthorizeUrl(args: {
        credentials: AdapterCredentials;
        state: string;
        redirectUri: string;
    }): string;

    exchangeCodeForToken(args: {
        code: string;
        credentials: AdapterCredentials;
        redirectUri: string;
    }): Promise<OAuthExchangeResult>;

    refreshToken(args: {
        refreshToken: string;
        credentials: AdapterCredentials;
    }): Promise<GitProviderToken>;

    createRelease(args: CreateReleaseArgs): Promise<{ releaseId: string; releaseUrl: string }>;

    updateCommitStatus(args: CommitStatusArgs): Promise<void>;
}
