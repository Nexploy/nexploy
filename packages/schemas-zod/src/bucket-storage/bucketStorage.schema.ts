import { z } from 'zod';

export const uploadVolumeToBucketStorageSchema = z.object({
    volumeName: z.string().min(1),
    bucket: z.string().min(1, 'Bucket is required'),
    accountId: z.string().min(1, 'Account is required'),
});

export const bucketStorageAddAccountSchema = z.object({
    displayName: z.string().min(1, 'Display name is required'),
    accessKeyId: z.string().min(1, 'Access key ID is required'),
    secretAccessKey: z.string().min(1, 'Secret access key is required'),
    region: z.string().min(1, 'Region is required'),
    endpoint: z
        .string()
        .url('Endpoint must be a valid URL')
        .optional()
        .or(z.literal(''))
        .transform((value) => (value ? value : undefined)),
});

export const bucketStorageDeleteAccountSchema = z.object({
    id: z.string().min(1),
});

export const downloadVolumeQuerySchema = z.object({
    volume: z.string().min(1),
});

export const uploadToBucketStorageQuerySchema = z.object({
    volume: z.string().min(1),
    bucket: z.string().min(1),
    accountId: z.string().min(1),
});

export const backupSchedulesQuerySchema = z.object({
    volume: z.string().min(1),
});

export type BucketStorageAddAccountInput = z.infer<typeof bucketStorageAddAccountSchema>;
