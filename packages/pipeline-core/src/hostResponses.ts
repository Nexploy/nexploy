export interface ImageDeleteResponse {
    deleted: string[];
    skipped: { id: string; name: string; reason: string }[];
}

export interface BucketStorageAccountInfo {
    id: string;
    displayName: string;
    region: string;
    endpoint: string | null;
    maskedAccessKeyId: string;
    createdAt: Date;
}

export interface GitBranch {
    name: string;
    protected: boolean;
}
