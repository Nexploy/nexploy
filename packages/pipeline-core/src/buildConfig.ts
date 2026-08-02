import type { WebhookTrigger } from '@workspace/pipeline-core/webhook';

export interface BuildConfig {
    userId: string;
    repositoryName: string;
    gitAccountId?: string;
    repositoryId: string;
    gitProvider: 'GITHUB' | 'GITLAB' | 'GITEA' | 'BITBUCKET' | 'AZURE_REPOS';
    gitUrl: string;
    gitBranch?: string;
    buildId: string;
    triggerSource: 'manual' | 'webhook';
    webhookTrigger?: WebhookTrigger;
    stageId?: string;
    environmentId?: string;
}
