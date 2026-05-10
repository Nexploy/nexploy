import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { GetCallerIdentityCommand, STSClient } from '@aws-sdk/client-sts';
import { AwsCredentials } from '@workspace/typescript-interface/aws/aws';

export function createS3Client(creds: AwsCredentials, endpoint?: string): S3Client {
    return new S3Client({
        region: creds.region,
        credentials: {
            accessKeyId: creds.accessKeyId,
            secretAccessKey: creds.secretAccessKey,
        },
        ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
    });
}

export async function verifyAwsCredentials(creds: AwsCredentials): Promise<void> {
    const sts = new STSClient({
        region: creds.region,
        credentials: {
            accessKeyId: creds.accessKeyId,
            secretAccessKey: creds.secretAccessKey,
        },
    });
    try {
        await sts.send(new GetCallerIdentityCommand({}));
    } catch (err: any) {
        throw new Error(`Invalid AWS credentials: ${err.message ?? err.name}`);
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
