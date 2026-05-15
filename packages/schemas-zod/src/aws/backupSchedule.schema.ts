import { z } from 'zod';

export const backupFrequencies = ['HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY'] as const;

export const createBackupScheduleSchema = (t: any) =>
    z.object({
        volumeName: z.string().min(1),
        bucket: z.string().min(1, t('fieldRequired', { field: t('fieldNames.bucket') })),
        awsAccountId: z.string().min(1, t('fieldRequired', { field: t('fieldNames.awsAccount') })),
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

export type CreateBackupScheduleInput = z.infer<ReturnType<typeof createBackupScheduleSchema>>;
