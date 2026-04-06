import { NextResponse } from 'next/server';
import { kyDocker } from '@/lib/api/kyDocker';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { getAwsCredentials } from '@/services/aws.service';
import * as crypto from 'node:crypto';
import { uploadToS3QuerySchema } from '@workspace/schemas-zod/aws/aws.schema';

function hmacSha256(key: Buffer | string, data: string): Buffer {
    return crypto.createHmac('sha256', key).update(data).digest();
}

function hmacSha256Hex(key: Buffer | string, data: string): string {
    return crypto.createHmac('sha256', key).update(data).digest('hex');
}

function sha256Hex(data: string | Buffer): string {
    return crypto.createHash('sha256').update(data).digest('hex');
}

async function uploadToS3(
    accessKeyId: string,
    secretAccessKey: string,
    region: string,
    bucket: string,
    objectKey: string,
    fileBuffer: Buffer,
): Promise<void> {
    const host = `${bucket}.s3.${region}.amazonaws.com`;
    const url = `https://${host}/${objectKey}`;
    const contentType = 'application/gzip';
    const service = 's3';

    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '').slice(0, 15) + 'Z';
    const dateStamp = amzDate.slice(0, 8);

    const payloadHash = sha256Hex(fileBuffer);
    const canonicalHeaders = `content-type:${contentType}\nhost:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
    const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';
    const canonicalRequest = ['PUT', `/${objectKey}`, '', canonicalHeaders, signedHeaders, payloadHash].join('\n');

    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const stringToSign = ['AWS4-HMAC-SHA256', amzDate, credentialScope, sha256Hex(canonicalRequest)].join('\n');

    const signingKey = hmacSha256(
        hmacSha256(hmacSha256(hmacSha256(`AWS4${secretAccessKey}`, dateStamp), region), service),
        'aws4_request',
    );
    const signature = hmacSha256Hex(signingKey, stringToSign);
    const authorization = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Content-Type': contentType,
            Host: host,
            'x-amz-content-sha256': payloadHash,
            'x-amz-date': amzDate,
            Authorization: authorization,
            'Content-Length': String(fileBuffer.byteLength),
        },
        body: new Uint8Array(fileBuffer),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`S3 upload failed: ${response.status} ${text}`);
    }
}

export const POST = route
    .use(authRouteServer)
    .use(requirePermission('backup', 'create'))
    .query(uploadToS3QuerySchema)
    .handler(async (_, { query }) => {
        const { volume: volumeName, bucket, accountId } = query;

        const awsCredentials = await getAwsCredentials(accountId);

        const buffer = await kyDocker
            .get(`backups/download/${encodeURIComponent(volumeName)}`, { timeout: false })
            .arrayBuffer();

        const objectKey = `${volumeName}-${Date.now()}.tar.gz`;

        await uploadToS3(
            awsCredentials.accessKeyId,
            awsCredentials.secretAccessKey,
            awsCredentials.region,
            bucket,
            objectKey,
            Buffer.from(buffer),
        );

        return NextResponse.json({ success: true, objectKey });
    });
