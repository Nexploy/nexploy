export interface GitAccountSummary {
    id: string;
    provider: 'GITHUB' | 'GITLAB';
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

export interface GitBranch {
    name: string;
    protected: boolean;
}

export interface GitProviderToken {
    accessToken: string | null;
    refreshToken: string | null;
    accessTokenExpiresAt: Date | null;
}

export interface GitLabCommit {
    id: string;
    short_id: string;
    message: string;
    author_name: string;
    author_email: string;
    created_at: string;
    web_url: string;
}
