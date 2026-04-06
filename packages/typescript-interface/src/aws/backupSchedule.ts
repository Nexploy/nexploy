export type Frequency = 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface BackupScheduleStartEvent {
    id: string;
    volumeName: string;
    bucket: string;
    awsAccountId: string;
    frequency: Frequency;
    scheduledHour: number;
    scheduledMinute: number;
    scheduledDay?: number;
    nextRunAt: string;
}
