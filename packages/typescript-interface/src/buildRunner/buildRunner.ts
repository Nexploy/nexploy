export type BuildRunnerStatus = 'OFFLINE' | 'ONLINE' | 'DRAINING';

export interface BuildRunnerInfo {
    id: string;
    name: string;
    description: string | null;
    tokenPrefix: string;
    labels: string[];
    maxConcurrency: number;
    enabled: boolean;
    status: BuildRunnerStatus;
    lastSeenAt: Date | null;
    version: string | null;
    platforms: string[];
    activeJobs: number;
    createdAt: Date;
}

export interface BuildRunnerWithToken {
    runner: BuildRunnerInfo;
    token: string;
}
