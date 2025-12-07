import { GitProviderToken } from '../git/git';

export type BuildStatus =
    | 'QUEUED'
    | 'BUILDING'
    | 'COMPLETED'
    | 'FAILED'
    | 'DEPLOYING'
    | 'CANCELLED';

export type BuildStep =
    | 'clone-repository'
    | 'prepare-dockerfile'
    | 'write-env-file'
    | 'build-docker-image'
    | 'deploy-container'
    | 'cleanup'
    | 'finalize-logs';

export const BUILD_STEPS_ORDER: BuildStep[] = [
    'clone-repository',
    'prepare-dockerfile',
    'write-env-file',
    'build-docker-image',
    'deploy-container',
    'cleanup',
    'finalize-logs',
];

export interface BuildLogEntry {
    createdAt: Date;
    level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
    step: string;
    message: string;
    buildId: string;
}

export interface BuildConfig extends GitProviderToken {
    userId: string;
    repositoryId: string;
    repositoryPath: string;
    gitProvider: string;
    gitUrl: string;
    gitBranch: string;
    envVariables: Record<string, string>;
    dockerfile?: string;
    dockerfilePath?: string;
    imageName: string;
    imageTag: string;
    autoDeploy: boolean;
    startFromStep?: BuildStep;
}
