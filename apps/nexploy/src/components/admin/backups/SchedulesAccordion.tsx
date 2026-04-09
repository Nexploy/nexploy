import { getTranslations } from 'next-intl/server';
import { CalendarClock } from 'lucide-react';
import dayjs from 'dayjs';
import { BackupSchedule } from 'generated/client';
import { Badge } from '@workspace/ui/components/badge';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@workspace/ui/components/accordion';
import { DeleteScheduleButton } from './DeleteScheduleButton';

const frequencyKeys = {
    HOURLY: 'frequencyHourly',
    DAILY: 'frequencyDaily',
    WEEKLY: 'frequencyWeekly',
    MONTHLY: 'frequencyMonthly',
} as const;

const DAY_OF_WEEK_KEYS = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
] as const;

type TFunction = Awaited<ReturnType<typeof getTranslations<'admin'>>>;

function formatScheduleDetail(s: BackupSchedule, t: TFunction): string {
    const m = String(s.scheduledMinute).padStart(2, '0');
    const time = `${String(s.scheduledHour).padStart(2, '0')}:${m}`;

    switch (s.frequency) {
        case 'HOURLY':
            return `:${m}`;
        case 'DAILY':
            return `${t('at')} ${time}`;
        case 'WEEKLY': {
            const dayKey = DAY_OF_WEEK_KEYS[(s.scheduledDay ?? 1) % 7] ?? 'monday';
            return `${t(dayKey)} ${t('at')} ${time}`;
        }
        case 'MONTHLY':
            return `${t('at')} ${time} (${t('scheduledDayOfMonth').toLowerCase()} ${s.scheduledDay ?? 1})`;
    }
}

interface SchedulesAccordionProps {
    volumeSchedules: { volumeName: string; schedules: BackupSchedule[] }[];
}

export async function SchedulesAccordion({ volumeSchedules }: SchedulesAccordionProps) {
    const t = await getTranslations('admin');

    const volumesWithSchedules = volumeSchedules.filter(({ schedules }) => schedules.length > 0);

    if (volumesWithSchedules.length === 0) return null;

    return (
        <div className="bg-card overflow-hidden rounded-md border shadow-sm">
            <div className="flex items-center gap-2 border-b px-4 py-3">
                <CalendarClock className="text-primary size-4" />
                <span className="text-sm font-medium">{t('activeSchedules')}</span>
            </div>
            <Accordion type="multiple" className="divide-y">
                {volumesWithSchedules.map(({ volumeName, schedules }) => (
                    <AccordionItem key={volumeName} value={volumeName}>
                        <AccordionTrigger className="cursor-pointer px-4 py-3 hover:no-underline">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{volumeName}</span>
                                <Badge className="h-5">{schedules.length}</Badge>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-3">
                            <div className="space-y-2">
                                {schedules.map((schedule) => (
                                    <div
                                        key={schedule.id}
                                        className="bg-muted/50 flex items-center justify-between rounded-md border px-3 py-2"
                                    >
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-sm font-medium">
                                                {schedule.bucket}
                                            </span>
                                            <span className="text-muted-foreground text-xs">
                                                {t(frequencyKeys[schedule.frequency])} —
                                                {formatScheduleDetail(schedule, t)}
                                            </span>
                                            <span className="text-muted-foreground text-xs">
                                                {t('lastRun')}:
                                                {schedule.lastRunAt
                                                    ? dayjs(schedule.lastRunAt).format(
                                                          'DD/MM/YYYY HH:mm',
                                                      )
                                                    : t('never')}
                                            </span>
                                            <span className="text-muted-foreground text-xs">
                                                {t('nextRun')}:
                                                {dayjs(schedule.nextRunAt).format(
                                                    'DD/MM/YYYY HH:mm',
                                                )}
                                            </span>
                                        </div>
                                        <DeleteScheduleButton scheduleId={schedule.id} />
                                    </div>
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    );
}
