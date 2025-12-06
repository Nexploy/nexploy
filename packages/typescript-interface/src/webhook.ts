export interface WebhookPayload {
    repositoryUrl: string;
    branch: string;
    commitHash?: string;
    commitMessage?: string;
}
