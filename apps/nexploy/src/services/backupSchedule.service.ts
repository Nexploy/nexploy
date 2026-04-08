import { BackupSchedule, Frequency } from 'generated/client';
import { prisma } from '../../prisma/prisma';
import { cookies } from 'next/headers';

export function getNextRunAt(
    frequency: Frequency,
    scheduledHour = 0,
    scheduledMinute = 0,
    scheduledDay?: number,
): Date {
    const now = new Date();

    switch (frequency) {
        case 'HOURLY': {
            const candidate = new Date(now);
            candidate.setMinutes(scheduledMinute, 0, 0);
            if (candidate <= now) candidate.setHours(candidate.getHours() + 1);
            return candidate;
        }
        case 'DAILY': {
            const candidate = new Date(now);
            candidate.setHours(scheduledHour, scheduledMinute, 0, 0);
            if (candidate <= now) candidate.setDate(candidate.getDate() + 1);
            return candidate;
        }
        case 'WEEKLY': {
            const targetDay = scheduledDay ?? 1;
            const candidate = new Date(now);
            candidate.setHours(scheduledHour, scheduledMinute, 0, 0);
            const currentDay = candidate.getDay();
            let daysUntil = (targetDay - currentDay + 7) % 7;
            if (daysUntil === 0 && candidate <= now) daysUntil = 7;
            candidate.setDate(candidate.getDate() + daysUntil);
            return candidate;
        }
        case 'MONTHLY': {
            const targetDay = scheduledDay ?? 1;
            const candidate = new Date(now);
            candidate.setDate(targetDay);
            candidate.setHours(scheduledHour, scheduledMinute, 0, 0);
            if (candidate <= now) {
                candidate.setMonth(candidate.getMonth() + 1);
                candidate.setDate(targetDay);
            }
            return candidate;
        }
    }
}

export async function getBackupSchedulesForVolume(volumeName: string): Promise<BackupSchedule[]> {
    try {
        const cookieStore = await cookies();
        const environmentId = cookieStore.get('X-Docker-Environment')?.value;

        return prisma.backupSchedule.findMany({
            where: { volumeName, ...(environmentId ? { environmentId } : {}) },
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
    scheduledHour: number,
    scheduledMinute: number,
    scheduledDay?: number,
): Promise<BackupSchedule> {
    try {
        const cookieStore = await cookies();
        const environmentId = cookieStore.get('X-Docker-Environment')?.value;

        return prisma.backupSchedule.create({
            data: {
                volumeName,
                environmentId,
                bucket,
                awsAccountId,
                frequency,
                scheduledHour,
                scheduledMinute,
                scheduledDay,
                nextRunAt: getNextRunAt(frequency, scheduledHour, scheduledMinute, scheduledDay),
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

export async function deleteBackupSchedulesByVolume(volumeName: string): Promise<number> {
    try {
        const result = await prisma.backupSchedule.deleteMany({ where: { volumeName } });
        return result.count;
    } catch {
        throw new Error('Failed to delete backup schedules for volume');
    }
}

export async function markScheduleRan(id: string): Promise<void> {
    try {
        const schedule = await prisma.backupSchedule.findUniqueOrThrow({ where: { id } });
        await prisma.backupSchedule.update({
            where: { id },
            data: {
                lastRunAt: new Date(),
                nextRunAt: getNextRunAt(
                    schedule.frequency,
                    schedule.scheduledHour,
                    schedule.scheduledMinute,
                    schedule.scheduledDay ?? undefined,
                ),
            },
        });
    } catch {
        throw new Error('Failed to mark schedule as ran');
    }
}
