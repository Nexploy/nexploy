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

export type ProvidersGit = 'github' | 'gitlab';
