interface GitlabCommit {
    id: string;
    short_id: string;
    created_at: string;
    parent_ids: string[];
    title: string;
    message: string;
    author_name: string;
    author_email: string;
    authored_date: string;
    committer_name: string;
    committer_email: string;
    committed_date: string;
    trailers: Record<string, string>;
    extended_trailers: Record<string, string>;
    web_url: string;
}

export interface GitlabBranch {
    name: string;
    merged: boolean;
    protected: boolean;
    default: boolean;
    developers_can_push: boolean;
    developers_can_merge: boolean;
    can_push: boolean;
    web_url: string;
    commit: GitlabCommit;
}

interface BranchesQueryParams {
    per_page?: number;
    page?: number;
    search?: string;
}
