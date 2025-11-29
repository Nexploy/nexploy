export type BuildStatus = 'QUEUED' | 'BUILDING' | 'COMPLETED' | 'FAILED';

export interface BuildLogEntry {
    createdAt: Date;
    level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
    step: string;
    message: string;
    buildId: string;
}

export interface BuildConfig {
    projectId: string;
    projectPath: string;
    gitUrl: string;
    gitBranch: string;
    gitToken?: string;
    envVariables: Record<string, string>;
    dockerfile?: string;
    dockerfilePath?: string;
    imageName: string;
    imageTag: string;
    port?: number;
    autoDeploy: boolean;
}
