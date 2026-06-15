export type BuildStatus =
    | 'QUEUED'
    | 'BUILDING'
    | 'COMPLETED'
    | 'FAILED'
    | 'DEPLOYING'
    | 'CANCELLED';

export interface RepositoryResult {
    id: string;
    name: string;
    repositoryUrl: string;
    gitProvider: string;
    build: Array<{ id: string; status: BuildStatus; numberBuild: number }>;
}
