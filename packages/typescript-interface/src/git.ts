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

export interface GetGitProviderToken {
    accessToken: string | null;
    refreshToken: string | null;
    accessTokenExpiresAt: Date | null;
}
