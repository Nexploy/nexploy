import { z } from 'zod';

export const uploadVolumeToS3Schema = (t: any) =>
    z.object({
        volumeName: z.string().min(1),
        bucket: z.string().min(1, t('fieldRequired', { field: t('fieldNames.bucket') })),
        accountId: z.string().min(1, t('fieldRequired', { field: t('fieldNames.account') })),
    });

export const awsAddAccountSchema = (t: any) =>
    z.object({
        displayName: z.string().min(1, t('fieldRequired', { field: t('fieldNames.displayName') })),
        accessKeyId: z.string().min(1, t('fieldRequired', { field: t('fieldNames.accessKeyId') })),
        secretAccessKey: z.string().min(1, t('fieldRequired', { field: t('fieldNames.secretAccessKey') })),
        region: z.string().min(1, t('fieldRequired', { field: t('fieldNames.region') })),
    });

export const awsDeleteAccountSchema = z.object({
    id: z.string().min(1),
});

export const downloadVolumeQuerySchema = z.object({
    volume: z.string().min(1),
});

export const uploadToS3QuerySchema = z.object({
    volume: z.string().min(1),
    bucket: z.string().min(1),
    accountId: z.string().min(1),
});

export const backupSchedulesQuerySchema = z.object({
    volume: z.string().min(1),
});

export type AwsAddAccountInput = z.infer<ReturnType<typeof awsAddAccountSchema>>;
