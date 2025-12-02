import { GetGitProviderToken } from '../git';

export type BuildStatus = 'QUEUED' | 'BUILDING' | 'COMPLETED' | 'FAILED' | 'DEPLOYING' | 'CANCELLED';

export interface BuildLogEntry {
    createdAt: Date;
    level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
    step: string;
    message: string;
    buildId: string;
}

export interface BuildConfig extends GetGitProviderToken {
    userId: string;
    projectId: string;
    projectPath: string;
    gitProvider: string;
    gitUrl: string;
    gitBranch: string;
    envVariables: Record<string, string>;
    dockerfile?: string;
    dockerfilePath?: string;
    imageName: string;
    imageTag: string;
    port?: number;
    autoDeploy: boolean;
}
