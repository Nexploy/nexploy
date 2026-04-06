import { z } from 'zod';

export const backupFrequencies = ['HOURLY', 'DAILY', 'WEEKLY'] as const;

export const createBackupScheduleSchema = z.object({
    volumeName: z.string().min(1),
    bucket: z.string().min(1, 'Bucket name required'),
    awsAccountId: z.string().min(1, 'AWS account required'),
    frequency: z.enum(backupFrequencies),
});

export const deleteBackupScheduleSchema = z.object({
    id: z.string().min(1),
});

export type CreateBackupScheduleInput = z.infer<typeof createBackupScheduleSchema>;
