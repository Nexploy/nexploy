import { z } from 'zod';

export const backupFrequencies = ['HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY'] as const;

export const createBackupScheduleSchema = z.object({
    volumeName: z.string().min(1),
    bucket: z.string().min(1, 'Bucket is required'),
    bucketStorageAccountId: z.string().min(1, 'Bucket storage account is required'),
    frequency: z.enum(backupFrequencies),
    scheduledHour: z.number().int().min(0).max(23).default(0),
    scheduledMinute: z.number().int().min(0).max(59).default(0),
    scheduledDay: z.number().int().min(0).max(31).optional(),
});

export const deleteBackupScheduleSchema = z.object({
    id: z.string().min(1),
});

export const syncVolumeDeleteSchema = z.object({
    volumeName: z.string().min(1),
});

export type CreateBackupScheduleInput = z.infer<typeof createBackupScheduleSchema>;
