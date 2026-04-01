import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { INodeExecutor, NodeExecutionContext, NodeExecutionResult, getFromAllOutputs } from '@/types/pipeline.type';

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
    endpoint: string,
    bucket: string,
    accessKey: string,
    secretKey: string,
    useSSL: boolean,
    objectKey: string,
    fileBuffer: Buffer,
    contentType: string,
): Promise<void> {
    const protocol = useSSL ? 'https' : 'http';
    const host = endpoint.replace(/^https?:\/\//, '');
    const url = `${protocol}://${host}/${bucket}/${objectKey}`;

    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '').slice(0, 15) + 'Z';
    const dateStamp = amzDate.slice(0, 8);
    const region = 'us-east-1';
    const service = 's3';

    const payloadHash = sha256Hex(fileBuffer);
    const canonicalHeaders =
        `content-type:${contentType}\nhost:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
    const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';
    const canonicalRequest = [
        'PUT',
        `/${bucket}/${objectKey}`,
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
            hmacSha256(
                hmacSha256(`AWS4${secretKey}`, dateStamp),
                region,
            ),
            service,
        ),
        'aws4_request',
    );
    const signature = hmacSha256Hex(signingKey, stringToSign);
    const authorization = `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Content-Type': contentType,
            Host: host,
            'x-amz-content-sha256': payloadHash,
            'x-amz-date': amzDate,
            Authorization: authorization,
        },
        body: new Uint8Array(fileBuffer),
    });

    if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`S3 upload failed (${response.status}): ${text}`);
    }
}

export class UploadArtifactExecutor implements INodeExecutor {
    readonly type = 'upload-artifact';

    async execute(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId } = ctx;

        const endpoint = nodeConfig.endpoint as string;
        const bucket = nodeConfig.bucket as string;
        const accessKey = nodeConfig.accessKey as string;
        const secretKey = nodeConfig.secretKey as string;
        const sourcePath = nodeConfig.sourcePath as string;
        const destinationPath = nodeConfig.destinationPath as string;
        const useSSL = (nodeConfig.useSSL as boolean | undefined) ?? true;

        if (!endpoint || !bucket || !accessKey || !secretKey || !sourcePath || !destinationPath) {
            throw new Error('endpoint, bucket, accessKey, secretKey, sourcePath and destinationPath are all required');
        }

        const workDir = getFromAllOutputs<string>(allOutputs, 'workDir');
        const base = workDir ?? process.cwd();
        const resolvedSource = path.isAbsolute(sourcePath) ? sourcePath : path.join(base, sourcePath);

        await logger.info(nodeId, `Uploading ${sourcePath} → s3://${bucket}/${destinationPath}`);

        const stats = fs.statSync(resolvedSource);

        if (stats.isDirectory()) {
            // Upload all files in directory
            const files = fs.readdirSync(resolvedSource, { recursive: true }) as string[];
            let uploaded = 0;
            for (const file of files) {
                const fullPath = path.join(resolvedSource, file);
                if (fs.statSync(fullPath).isFile()) {
                    const objectKey = path.posix.join(destinationPath, file.replace(/\\/g, '/'));
                    const fileBuffer = fs.readFileSync(fullPath);
                    await uploadToS3(endpoint, bucket, accessKey, secretKey, useSSL, objectKey, fileBuffer, 'application/octet-stream');
                    uploaded++;
                    await logger.debug(nodeId, `Uploaded: ${objectKey}`);
                }
            }
            await logger.info(nodeId, `Uploaded ${uploaded} files to s3://${bucket}/${destinationPath}`);
            return { success: true, output: { uploaded, bucket, destinationPath } };
        } else {
            const fileBuffer = fs.readFileSync(resolvedSource);
            const contentType = 'application/octet-stream';
            await uploadToS3(endpoint, bucket, accessKey, secretKey, useSSL, destinationPath, fileBuffer, contentType);
            await logger.info(nodeId, `Uploaded to s3://${bucket}/${destinationPath}`);
            return { success: true, output: { uploaded: 1, bucket, destinationPath } };
        }
    }
}

export const uploadArtifactExecutor = new UploadArtifactExecutor();
