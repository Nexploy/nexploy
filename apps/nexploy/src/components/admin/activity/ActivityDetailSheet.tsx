'use client';

import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';
import type { ActivityLogEntry } from '@workspace/typescript-interface/activity';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@workspace/ui/components/sheet';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { ActivityStatusBadge } from '@/components/admin/activity/ActivityStatusBadge';

interface ActivityDetailSheetProps {
    entry: ActivityLogEntry | null;
    onOpenChange: (open: boolean) => void;
}

function DetailRow({ label, value }: { label: string; value: string | null }) {
    if (!value) return null;

    return (
        <div className="flex flex-col gap-0.5 py-1.5">
            <span className="text-muted-foreground text-xs">{label}</span>
            <span className="text-sm break-all">{value}</span>
        </div>
    );
}

export function ActivityDetailSheet({ entry, onOpenChange }: ActivityDetailSheetProps) {
    const t = useTranslations('admin.activity');

    if (!entry) return null;

    return (
        <Sheet open={Boolean(entry)} onOpenChange={onOpenChange}>
            <SheetContent className="w-full gap-0 sm:max-w-lg">
                <SheetHeader>
                    <SheetTitle className="break-all">{entry.name}</SheetTitle>
                    <SheetDescription>{dayjs(entry.createdAt).format('YYYY-MM-DD HH:mm:ss')}</SheetDescription>
                </SheetHeader>

                <ScrollAreaWithShadow className="h-full" bottomShadow>
                    <div className="flex flex-col divide-y px-4 pb-6">
                        <div className="py-2">
                            <ActivityStatusBadge status={entry.status} />
                        </div>

                        <DetailRow label={t('columns.actor')} value={entry.actorName ?? entry.actorEmail} />
                        <DetailRow label={t('detail.actorRole')} value={entry.actorRole} />
                        <DetailRow label={t('detail.actorType')} value={t(`actorType.${entry.actorType}`)} />
                        <DetailRow label={t('columns.source')} value={t(`source.${entry.source}`)} />
                        <DetailRow label={t('columns.target')} value={entry.targetName ?? entry.targetId} />
                        <DetailRow label={t('detail.targetId')} value={entry.targetId} />
                        <DetailRow label={t('detail.organization')} value={entry.organizationId} />
                        <DetailRow label={t('detail.environment')} value={entry.environmentId} />
                        <DetailRow
                            label={t('columns.duration')}
                            value={entry.durationMs === null ? null : `${entry.durationMs} ms`}
                        />
                        <DetailRow label={t('detail.ipAddress')} value={entry.ipAddress} />
                        <DetailRow label={t('detail.userAgent')} value={entry.userAgent} />
                        <DetailRow label={t('detail.error')} value={entry.errorMessage} />

                        {entry.metadata !== null && entry.metadata !== undefined && (
                            <div className="flex flex-col gap-1 py-2">
                                <span className="text-muted-foreground text-xs">{t('detail.metadata')}</span>
                                <pre className="bg-muted overflow-x-auto rounded-md p-3 text-xs">
                                    {JSON.stringify(entry.metadata, null, 2)}
                                </pre>
                            </div>
                        )}
                    </div>
                </ScrollAreaWithShadow>
            </SheetContent>
        </Sheet>
    );
}
