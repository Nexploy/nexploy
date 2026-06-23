import { prisma } from '../../prisma/prisma';
import { decrypt, encrypt } from '@/lib/encryption';
import { AwsAccountInfo, AwsCredentials } from '@workspace/typescript-interface/aws/aws';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';

export type { AwsAccountInfo, AwsCredentials };

export async function getAllAwsAccounts(): Promise<AwsAccountInfo[]> {
    const t = await getErrorTranslator();
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
        throw new Error(t('aws.getAccountsFailed'));
    }
}

export async function saveAwsAccount(
    displayName: string,
    accessKeyId: string,
    secretAccessKey: string,
    region: string,
): Promise<AwsAccountInfo> {
    const t = await getErrorTranslator();
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
        throw new Error(t('aws.saveAccountFailed'));
    }
}

export async function deleteAwsAccount(id: string): Promise<void> {
    const t = await getErrorTranslator();
    try {
        await prisma.awsCredential.delete({ where: { id } });
    } catch (error: unknown) {
        throw new Error(t('aws.deleteAccountFailed'));
    }
}

export async function getAwsCredentials(id: string): Promise<AwsCredentials> {
    const t = await getErrorTranslator();
    try {
        const record = await prisma.awsCredential.findUnique({ where: { id } });
        if (!record) throw new Error(t('aws.accountNotFound'));

        return {
            accessKeyId: decrypt(record.accessKeyId),
            secretAccessKey: decrypt(record.secretAccessKey),
            region: record.region,
        };
    } catch (error: unknown) {
        throw new Error(t('aws.retrieveCredentialsFailed'));
    }
}
