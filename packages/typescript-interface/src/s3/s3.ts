export interface S3AccountInfo {
    id: string;
    displayName: string;
    region: string;
    endpoint: string | null;
    maskedAccessKeyId: string;
    createdAt: Date;
}

export interface S3Credentials {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    endpoint?: string | null;
}
