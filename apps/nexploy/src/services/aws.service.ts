import { prisma } from '../../prisma/prisma';
import { decrypt, encrypt } from '@/lib/encryption';
import { AwsAccountInfo, AwsCredentials } from '@workspace/typescript-interface/aws/aws';

export type { AwsAccountInfo, AwsCredentials };

export async function getAllAwsAccounts(): Promise<AwsAccountInfo[]> {
    try {
        const records = await prisma.awsCredential.findMany({
            orderBy: { createdAt: 'asc' },
        });

        return records.map((r) => {
            const decrypted = decrypt(r.accessKeyId);
            const masked =
                decrypted.length > 8 ? decrypted.slice(0, 4) + '...' + decrypted.slice(-4) : '****';

            return {
                id: r.id,
                displayName: r.displayName,
                region: r.region,
                maskedAccessKeyId: masked,
                createdAt: r.createdAt,
            };
        });
    } catch (error: unknown) {
        throw new Error('Failed to get AWS accounts');
    }
}

export async function saveAwsAccount(
    displayName: string,
    accessKeyId: string,
    secretAccessKey: string,
    region: string,
): Promise<AwsAccountInfo> {
    try {
        const record = await prisma.awsCredential.create({
            data: {
                displayName,
                accessKeyId: encrypt(accessKeyId),
                secretAccessKey: encrypt(secretAccessKey),
                region,
            },
        });

        const masked =
            accessKeyId.length > 8
                ? accessKeyId.slice(0, 4) + '...' + accessKeyId.slice(-4)
                : '****';

        return {
            id: record.id,
            displayName: record.displayName,
            region: record.region,
            maskedAccessKeyId: masked,
            createdAt: record.createdAt,
        };
    } catch (error: unknown) {
        throw new Error('Failed to save AWS account');
    }
}

export async function deleteAwsAccount(id: string): Promise<void> {
    try {
        await prisma.awsCredential.delete({ where: { id } });
    } catch (error: unknown) {
        throw new Error('Failed to delete AWS account');
    }
}

export async function getAwsCredentials(id: string): Promise<AwsCredentials> {
    try {
        const record = await prisma.awsCredential.findUnique({ where: { id } });
        if (!record) throw new Error('AWS account not found');

        return {
            accessKeyId: decrypt(record.accessKeyId),
            secretAccessKey: decrypt(record.secretAccessKey),
            region: record.region,
        };
    } catch (error: unknown) {
        throw new Error('Failed to retrieve AWS credentials');
    }
}
