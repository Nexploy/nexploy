export interface GitAccountSummary {
    id: string;
    provider: 'GITHUB' | 'GITLAB' | 'GITEA' | 'BITBUCKET' | 'AZURE_REPOS';
    providerAccountId: string;
    providerUsername: string | null;
    gitProviderId: string;
    gitProvider: {
        displayName: string;
        ownerName: string | null;
        ownerType: string | null;
        baseUrl: string | null;
    };
}

export interface GitRepository {
    id: string;
    name: string;
    fullName: string;
    url: string;
    private: boolean;
    defaultBranch: string;
}

export interface GitRepositoryList {
    repositories: GitRepository[];
    totalCount: number;
    alreadyAddedCount: number;
}

export type { GitBranch } from '@workspace/pipeline-core/hostResponses';

export type { GitProviderToken } from '@workspace/pipeline-core/gitToken';

export interface GitLabCommit {
    id: string;
    short_id: string;
    message: string;
    author_name: string;
    author_email: string;
    created_at: string;
    web_url: string;
}
