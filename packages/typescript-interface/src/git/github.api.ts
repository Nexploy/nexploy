export interface GitHubCommitResponse {
    sha: string;
    commit: {
        message: string;
        author: { name: string; email: string; date: string };
    };
    html_url: string;
}

export interface GitHubTokenResponse {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
}

export interface GitHubUserResponse {
    id: number;
    login: string;
}

export interface GitHubManifestResponse {
    id: number;
    slug: string;
    name: string;
    client_id: string;
    client_secret: string;
    webhook_secret: string;
    pem: string;
    owner: { login: string; type: string };
}
