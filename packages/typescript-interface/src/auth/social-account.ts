export interface SocialAccount {
    id: string;
    providerId: string;
    createdAt: Date;
    updatedAt: Date;
    accountId: string;
    scopes?: string[];
}
