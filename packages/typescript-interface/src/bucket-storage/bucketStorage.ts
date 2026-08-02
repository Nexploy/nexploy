export type { BucketStorageAccountInfo } from '@nexploy/node-core/hostResponses';

export interface BucketStorageCredentials {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    endpoint?: string | null;
}
