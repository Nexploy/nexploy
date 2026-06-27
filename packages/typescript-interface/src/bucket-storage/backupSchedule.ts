export type Frequency = 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface BackupScheduleStartEvent {
    id: string;
    volumeName: string;
    environmentId?: string;
    bucket: string;
    bucketStorageAccountId: string;
    frequency: Frequency;
    scheduledHour: number;
    scheduledMinute: number;
    scheduledDay?: number;
    nextRunAt: string;
}
