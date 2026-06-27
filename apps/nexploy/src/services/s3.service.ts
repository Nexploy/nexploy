import { prisma } from '../../prisma/prisma';
import { decrypt, encrypt } from '@/lib/encryption';
import { S3AccountInfo, S3Credentials } from '@workspace/typescript-interface/s3/s3';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';

export type { S3AccountInfo, S3Credentials };

export async function getAllS3Accounts(): Promise<S3AccountInfo[]> {
    const t = await getErrorTranslator();
    try {
        const records = await prisma.s3Credential.findMany({
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
                endpoint: r.endpoint,
                maskedAccessKeyId: masked,
                createdAt: r.createdAt,
            };
        });
    } catch (error: unknown) {
        throw new Error(t('s3.getAccountsFailed'));
    }
}

export async function saveS3Account(
    displayName: string,
    accessKeyId: string,
    secretAccessKey: string,
    region: string,
    endpoint?: string,
): Promise<S3AccountInfo> {
    const t = await getErrorTranslator();
    try {
        const record = await prisma.s3Credential.create({
            data: {
                displayName,
                accessKeyId: encrypt(accessKeyId),
                secretAccessKey: encrypt(secretAccessKey),
                region,
                endpoint: endpoint || null,
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
            endpoint: record.endpoint,
            maskedAccessKeyId: masked,
            createdAt: record.createdAt,
        };
    } catch (error: unknown) {
        throw new Error(t('s3.saveAccountFailed'));
    }
}

export async function deleteS3Account(id: string): Promise<void> {
    const t = await getErrorTranslator();
    try {
        await prisma.s3Credential.delete({ where: { id } });
    } catch (error: unknown) {
        throw new Error(t('s3.deleteAccountFailed'));
    }
}

export async function getS3Credentials(id: string): Promise<S3Credentials> {
    const t = await getErrorTranslator();
    try {
        const record = await prisma.s3Credential.findUnique({ where: { id } });
        if (!record) throw new Error(t('s3.accountNotFound'));

        return {
            accessKeyId: decrypt(record.accessKeyId),
            secretAccessKey: decrypt(record.secretAccessKey),
            region: record.region,
            endpoint: record.endpoint,
        };
    } catch (error: unknown) {
        throw new Error(t('s3.retrieveCredentialsFailed'));
    }
}
