export interface BuildLogEntry {
    createdAt: Date;
    level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
    step: string;
    message: string;
    buildId: string;
}

export interface BuildConfig {
    userId: string;
    repositoryName: string;
    gitAccountId?: string;
    repositoryId: string;
    gitProvider: 'GITHUB' | 'GITLAB' | 'GITEA';
    gitUrl: string;
    gitBranch?: string;
    buildId: string;
    triggerSource: 'manual' | 'webhook';
    stageId?: string;
    environmentId?: string;
}
