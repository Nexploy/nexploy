import { z } from 'zod';

export const uploadVolumeToS3Schema = z.object({
    volumeName: z.string().min(1),
    bucket: z.string().min(1, 'Bucket name required'),
    accountId: z.string().min(1, 'AWS account required'),
});

export type UploadVolumeToS3Input = z.infer<typeof uploadVolumeToS3Schema>;

export const awsAddAccountSchema = z.object({
    displayName: z.string().min(1, 'Display name required'),
    accessKeyId: z.string().min(1, 'Access Key ID required'),
    secretAccessKey: z.string().min(1, 'Secret Access Key required'),
    region: z.string().min(1, 'Region required'),
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

export type AwsAddAccountInput = z.infer<typeof awsAddAccountSchema>;
