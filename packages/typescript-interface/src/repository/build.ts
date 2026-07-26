export interface BuildLogEntry {
    createdAt: Date;
    level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
    step: string;
    message: string;
    buildId: string;
}

import { WebhookTrigger } from '../webhook';

export interface BuildConfig {
    userId: string;
    repositoryName: string;
    gitAccountId?: string;
    repositoryId: string;
    gitProvider: 'GITHUB' | 'GITLAB' | 'GITEA' | 'BITBUCKET';
    gitUrl: string;
    gitBranch?: string;
    buildId: string;
    triggerSource: 'manual' | 'webhook';
    webhookTrigger?: WebhookTrigger;
    stageId?: string;
    environmentId?: string;
}
