import { ListBucketsCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { BucketStorageCredentials } from '@workspace/typescript-interface/bucket-storage/bucketStorage';

export function createBucketStorageClient(creds: BucketStorageCredentials): S3Client {
    const endpoint = creds.endpoint?.trim();

    return new S3Client({
        region: creds.region,
        credentials: {
            accessKeyId: creds.accessKeyId,
            secretAccessKey: creds.secretAccessKey,
        },
        requestChecksumCalculation: 'WHEN_REQUIRED',
        responseChecksumValidation: 'WHEN_REQUIRED',
        ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
    });
}

const AUTH_FAILURE_NAMES = new Set([
    'InvalidAccessKeyId',
    'SignatureDoesNotMatch',
    'InvalidSecurity',
    'AuthorizationHeaderMalformed',
    'AccountProblem',
]);

export async function verifyBucketStorageCredentials(creds: BucketStorageCredentials): Promise<void> {
    const client = createBucketStorageClient(creds);
    try {
        await client.send(new ListBucketsCommand({}));
    } catch (err: any) {
        const status = err?.$metadata?.httpStatusCode as number | undefined;
        const name = (err?.name ?? '') as string;

        if (status === undefined) {
            throw new Error(`Could not reach storage endpoint: ${err?.message ?? name}`);
        }
        if (status === 401 || AUTH_FAILURE_NAMES.has(name)) {
            throw new Error(`Invalid storage credentials: ${err?.message ?? name}`);
        }
    }
}

export async function putBucketStorageObject(
    client: S3Client,
    bucket: string,
    key: string,
    body: Uint8Array | Buffer,
    contentType: string,
): Promise<void> {
    await client.send(
        new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: body,
            ContentType: contentType,
        }),
    );
}
