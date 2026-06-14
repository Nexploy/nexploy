export interface DockerHubImage {
    name: string;
    slug: string;
    description: string;
    logoUrl: string | null;
    starCount: number;
    pullCount: string | null;
    isOfficial: boolean;
    publisher: string | null;
}

export interface DockerHubRawResult {
    name: string;
    slug: string;
    type: string;
    short_description?: string;
    star_count?: number;
    publisher?: { name?: string };
    logo_url?: { small?: string; large?: string };
    rate_plans?: Array<{
        repositories?: Array<{ pull_count?: string; is_official?: boolean }>;
    }>;
}

export interface DockerHubRawResponse {
    total: number;
    results: DockerHubRawResult[];
}

export type DockerHubSort = 'pull_count' | 'relevance';

export interface DockerHubSearchOptions {
    sort?: DockerHubSort;
    size?: number;
    from?: number;
}
