export type Frequency = 'HOURLY' | 'DAILY' | 'WEEKLY';

export interface BackupScheduleStartEvent {
    id: string;
    volumeName: string;
    bucket: string;
    awsAccountId: string;
    frequency: Frequency;
    nextRunAt: string;
}
