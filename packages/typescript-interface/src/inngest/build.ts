export interface BuildLogEntry {
    createdAt: Date;
    level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
    step: string;
    message: string;
    buildId: string;
}

export interface BuildConfig {
    userId: string;
    gitAccountId?: string;
    repositoryId: string;
    gitProvider: string;
    gitUrl: string;
    gitBranch?: string;
    gitCommitHash?: string;
    envVariables: Record<string, string>;
    imageName: string;
    imageTag: string;
}
