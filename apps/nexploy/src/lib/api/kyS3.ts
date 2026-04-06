import ky from 'ky';
import * as crypto from 'node:crypto';
import { getTokenAwsStorage } from '@/lib/storage/token-aws-storage';

function hmacSha256(key: Buffer | string, data: string): Buffer {
    return crypto.createHmac('sha256', key).update(data).digest();
}

function sha256Hex(data: string | Buffer): string {
    return crypto.createHash('sha256').update(data).digest('hex');
}

export const kyS3 = ky.create({
    timeout: false,
    hooks: {
        beforeRequest: [
            async (request) => {
                const { accessKeyId, secretAccessKey, region } = getTokenAwsStorage();

                const url = new URL(request.url);
                const host = url.hostname;
                const service = 's3';
                const contentType =
                    request.headers.get('Content-Type') ?? 'application/octet-stream';

                const bodyBytes = Buffer.from(await request.clone().arrayBuffer());

                const now = new Date();
                const amzDate =
                    now
                        .toISOString()
                        .replace(/[:-]|\.\d{3}/g, '')
                        .slice(0, 15) + 'Z';
                const dateStamp = amzDate.slice(0, 8);

                const payloadHash = sha256Hex(bodyBytes);
                const canonicalHeaders = `content-type:${contentType}\nhost:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
                const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';
                const canonicalRequest = [
                    request.method,
                    url.pathname,
                    '',
                    canonicalHeaders,
                    signedHeaders,
                    payloadHash,
                ].join('\n');

                const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
                const stringToSign = [
                    'AWS4-HMAC-SHA256',
                    amzDate,
                    credentialScope,
                    sha256Hex(canonicalRequest),
                ].join('\n');

                const signingKey = hmacSha256(
                    hmacSha256(
                        hmacSha256(hmacSha256(`AWS4${secretAccessKey}`, dateStamp), region),
                        service,
                    ),
                    'aws4_request',
                );
                const signature = crypto
                    .createHmac('sha256', signingKey)
                    .update(stringToSign)
                    .digest('hex');
                const authorization = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

                request.headers.set('x-amz-content-sha256', payloadHash);
                request.headers.set('x-amz-date', amzDate);
                request.headers.set('Authorization', authorization);
            },
        ],
    },
});
