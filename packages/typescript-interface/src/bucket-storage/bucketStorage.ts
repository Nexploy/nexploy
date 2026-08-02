export interface BucketStorageAccountInfo {
    id: string;
    displayName: string;
    region: string;
    endpoint: string | null;
    maskedAccessKeyId: string;
    createdAt: Date;
}

export interface BucketStorageCredentials {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    endpoint?: string | null;
}
