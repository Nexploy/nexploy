export type BuildStatus =
    | 'pending'
    | 'cloning'
    | 'building'
    | 'deploying'
    | 'completed'
    | 'failed';

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
    autoDeploy?: boolean;
}

export interface BuildJob {
    id: string;
    config: BuildConfig;
    status: BuildStatus;
    logs: BuildLogEntry[];
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
    error?: string;
    imageId?: string;
    deploymentId?: string;
    containerId?: string;
    port?: number;
}

export interface BuildLogEntry {
    timestamp: Date;
    level: 'info' | 'warn' | 'error' | 'debug';
    step: string;
    message: string;
}

export interface BuildStartResponse {
    jobId: string;
    status: BuildStatus;
    message: string;
}

export interface BuildStatusResponse {
    jobId: string;
    status: BuildStatus;
    logs: BuildLogEntry[];
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
    error?: string;
    imageId?: string;
    deploymentId?: string;
    containerId?: string;
    port?: number;
}
