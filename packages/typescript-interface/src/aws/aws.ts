export interface AwsAccountInfo {
    id: string;
    displayName: string;
    region: string;
    maskedAccessKeyId: string;
    createdAt: Date;
}

export interface AwsCredentials {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
}
