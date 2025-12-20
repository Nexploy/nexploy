import { GitProviderToken } from '../git/git';

export type BuildStatus =
    | 'QUEUED'
    | 'BUILDING'
    | 'COMPLETED'
    | 'FAILED'
    | 'DEPLOYING'
    | 'CANCELLED';

export type BuildType = 'DOCKERFILE' | 'DOCKER_COMPOSE' | 'NIXPACKS' | 'BUILDPACKS';

export type BuildStep =
    | 'clone-repository'
    | 'prepare-dockerfile'
    | 'prepare-compose'
    | 'write-env-file'
    | 'build-docker-image'
    | 'deploy-container'
    | 'deploy-compose'
    | 'cleanup'
    | 'finalize-logs';

export const BUILD_STEPS_ORDER: BuildStep[] = [
    'clone-repository',
    'prepare-dockerfile',
    'prepare-compose',
    'write-env-file',
    'build-docker-image',
    'deploy-container',
    'deploy-compose',
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
    gitCommitHash?: string;
    envVariables: Record<string, string>;
    buildType: BuildType;
    dockerfile?: string;
    dockerfilePath?: string;
    dockerComposePath?: string;
    imageName: string;
    imageTag: string;
    autoDeploy: boolean;
    startFromStep?: BuildStep;
    environmentId?: string;
}
