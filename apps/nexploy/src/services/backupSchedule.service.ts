import { BackupSchedule, Frequency } from 'generated/client';
import { prisma } from '../../prisma/prisma';

export function getNextRunAt(frequency: Frequency, from = new Date()): Date {
    const date = new Date(from);
    switch (frequency) {
        case 'HOURLY':
            date.setHours(date.getHours() + 1);
            break;
        case 'DAILY':
            date.setDate(date.getDate() + 1);
            break;
        case 'WEEKLY':
            date.setDate(date.getDate() + 7);
            break;
    }
    return date;
}

export async function getBackupSchedulesForVolume(volumeName: string): Promise<BackupSchedule[]> {
    try {
        return prisma.backupSchedule.findMany({
            where: { volumeName },
            orderBy: { createdAt: 'asc' },
        });
    } catch {
        throw new Error('Failed to get backup schedules for volume');
    }
}

export async function createBackupSchedule(
    volumeName: string,
    bucket: string,
    awsAccountId: string,
    frequency: Frequency,
): Promise<BackupSchedule> {
    try {
        return prisma.backupSchedule.create({
            data: {
                volumeName,
                bucket,
                awsAccountId,
                frequency,
                nextRunAt: getNextRunAt(frequency),
            },
        });
    } catch {
        throw new Error('Failed to create backup schedule');
    }
}

export async function deleteBackupSchedule(id: string): Promise<void> {
    try {
        await prisma.backupSchedule.delete({ where: { id } });
    } catch {
        throw new Error('Failed to delete backup schedule');
    }
}

export async function markScheduleRan(id: string, frequency: Frequency): Promise<void> {
    try {
        await prisma.backupSchedule.update({
            where: { id },
            data: { lastRunAt: new Date(), nextRunAt: getNextRunAt(frequency) },
        });
    } catch {
        throw new Error('Failed to mark schedule as ran');
    }
}
