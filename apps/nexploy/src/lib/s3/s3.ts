import { ListBucketsCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { S3Credentials } from '@workspace/typescript-interface/s3/s3';

export function createS3Client(creds: S3Credentials): S3Client {
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

export async function verifyS3Credentials(creds: S3Credentials): Promise<void> {
    const client = createS3Client(creds);
    try {
        await client.send(new ListBucketsCommand({}));
    } catch (err: any) {
        const status = err?.$metadata?.httpStatusCode as number | undefined;
        const name = (err?.name ?? '') as string;

        if (status === undefined) {
            throw new Error(`Could not reach S3 endpoint: ${err?.message ?? name}`);
        }
        if (status === 401 || AUTH_FAILURE_NAMES.has(name)) {
            throw new Error(`Invalid S3 credentials: ${err?.message ?? name}`);
        }
    }
}

export async function putS3Object(
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
