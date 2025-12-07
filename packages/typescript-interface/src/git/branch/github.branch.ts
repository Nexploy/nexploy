interface GithubUser {
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
    gravatar_id: string;
    url: string;
    html_url: string;
    followers_url: string;
    following_url: string;
    gists_url: string;
    starred_url: string;
    subscriptions_url: string;
    organizations_url: string;
    repos_url: string;
    events_url: string;
    received_events_url: string;
    type: string;
    site_admin: boolean;
}

interface GithubCommitVerification {
    verified: boolean;
    reason: string;
    signature: string | null;
    payload: string | null;
    verified_at: string | null;
}

interface GithubCommitAuthor {
    name: string;
    email: string;
    date: string;
}

interface GithubTree {
    sha: string;
    url: string;
}

interface GithubCommitDetail {
    author: GithubCommitAuthor;
    committer: GithubCommitAuthor;
    message: string;
    tree: GithubTree;
    url: string;
    comment_count: number;
    verification: GithubCommitVerification;
}

interface GithubCommitParent {
    sha: string;
    url: string;
    html_url: string;
}

interface GithubCommit {
    sha: string;
    node_id: string;
    commit: GithubCommitDetail;
    url: string;
    html_url: string;
    comments_url: string;
    author: GithubUser;
    committer: GithubUser;
    parents: GithubCommitParent[];
}

interface GithubBranchProtection {
    required_status_checks: {
        enforcement_level: string;
        contexts: string[];
        checks?: Array<{
            context: string;
            app_id: number;
        }>;
    };
}

interface GithubBranchLinks {
    self: string;
    html: string;
}

export interface GithubBranch {
    name: string;
    commit: GithubCommit;
    protected: boolean;
    protection?: GithubBranchProtection;
    protection_url: string;
    _links?: GithubBranchLinks;
}

interface GithubBranchSimple {
    name: string;
    commit: {
        sha: string;
        url: string;
    };
    protected: boolean;
    protection?: GithubBranchProtection;
    protection_url: string;
}

interface BranchesQueryParams {
    protected?: boolean;
    per_page?: number;
    page?: number;
}
