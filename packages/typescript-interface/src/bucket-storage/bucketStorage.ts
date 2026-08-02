export type { BucketStorageAccountInfo } from '@workspace/pipeline-core/hostResponses';

export interface BucketStorageCredentials {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    endpoint?: string | null;
}
