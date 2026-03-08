import { GitProviderToken } from '../git/git';

export type BuildStatus =
    | 'QUEUED'
    | 'BUILDING'
    | 'COMPLETED'
    | 'FAILED'
    | 'DEPLOYING'
    | 'CANCELLED';

export type BuildType = 'NODE_PIPELINE';

export interface BuildLogEntry {
    createdAt: Date;
    level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
    step: string;
    message: string;
    buildId: string;
}

export interface BuildConfig extends GitProviderToken {
    userId: string;
    gitAccountId?: string;
    repositoryId: string;
    gitProvider: string;
    gitUrl: string;
    gitBranch: string;
    gitCommitHash?: string;
    gitCommitMessage?: string;
    envVariables: Record<string, string>;
    imageName: string;
    imageTag: string;
    autoDeploy: boolean;
    environmentId?: string;
}
