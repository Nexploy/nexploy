import { prisma } from '../../prisma/prisma';
import { decrypt, encrypt } from '@/lib/encryption';
import { BucketStorageAccountInfo, BucketStorageCredentials } from '@workspace/typescript-interface/bucket-storage/bucketStorage';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';

export type { BucketStorageAccountInfo, BucketStorageCredentials };

export async function getAllBucketStorageAccounts(): Promise<BucketStorageAccountInfo[]> {
    const t = await getErrorTranslator();
    try {
        const records = await prisma.bucketStorageCredential.findMany({
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
        throw new Error(t('bucketStorage.getAccountsFailed'));
    }
}

export async function saveBucketStorageAccount(
    displayName: string,
    accessKeyId: string,
    secretAccessKey: string,
    region: string,
    endpoint?: string,
): Promise<BucketStorageAccountInfo> {
    const t = await getErrorTranslator();
    try {
        const record = await prisma.bucketStorageCredential.create({
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
        throw new Error(t('bucketStorage.saveAccountFailed'));
    }
}

export async function deleteBucketStorageAccount(id: string): Promise<void> {
    const t = await getErrorTranslator();
    try {
        await prisma.bucketStorageCredential.delete({ where: { id } });
    } catch (error: unknown) {
        throw new Error(t('bucketStorage.deleteAccountFailed'));
    }
}

export async function getBucketStorageCredentials(id: string): Promise<BucketStorageCredentials> {
    const t = await getErrorTranslator();
    try {
        const record = await prisma.bucketStorageCredential.findUnique({ where: { id } });
        if (!record) throw new Error(t('bucketStorage.accountNotFound'));

        return {
            accessKeyId: decrypt(record.accessKeyId),
            secretAccessKey: decrypt(record.secretAccessKey),
            region: record.region,
            endpoint: record.endpoint,
        };
    } catch (error: unknown) {
        throw new Error(t('bucketStorage.retrieveCredentialsFailed'));
    }
}
