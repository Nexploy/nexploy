export type WebhookEventType = 'push' | 'merge_request' | 'tag';

export type MergeRequestAction = 'opened' | 'updated' | 'merged' | 'closed';

export interface WebhookPayload {
    event: WebhookEventType;
    repositoryUrl: string;
    branch: string;
    targetBranch?: string;
    tagName?: string;
    mergeRequestAction?: MergeRequestAction;
    commitHash?: string;
    commitMessage?: string;
}

export interface WebhookTrigger {
    event: WebhookEventType;
    targetBranch?: string;
    tagName?: string;
    mergeRequestAction?: MergeRequestAction;
}
