'use client';

import dayjs from 'dayjs';
import { AlertCircleIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRef } from 'react';
import type { ActivityLogEntry } from '@workspace/typescript-interface/activity';
import { Alert, AlertDescription, AlertTitle } from '@workspace/ui/components/alert';
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
            <span style={{ wordBreak: 'break-word' }} className="text-muted-foreground text-xs">
                {label}
            </span>
            <span style={{ wordBreak: 'break-word' }} className="text-sm">
                {value}
            </span>
        </div>
    );
}

export function ActivityDetailSheet({ entry, onOpenChange }: ActivityDetailSheetProps) {
    const t = useTranslations('admin.activity');
    const lastEntryRef = useRef<ActivityLogEntry | null>(null);

    if (entry) lastEntryRef.current = entry;

    const displayedEntry = entry ?? lastEntryRef.current;

    return (
        <Sheet open={Boolean(entry)} onOpenChange={onOpenChange}>
            <SheetContent className="w-full gap-0 sm:max-w-xl">
                {displayedEntry && (
                    <>
                        <SheetHeader>
                            <SheetTitle className="break-all">{displayedEntry.name}</SheetTitle>
                            <SheetDescription>
                                {dayjs(displayedEntry.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                            </SheetDescription>
                        </SheetHeader>

                        <ScrollAreaWithShadow className="h-full" bottomShadow>
                            <div className="flex flex-col divide-y px-4 pb-6">
                                <div className="py-2">
                                    <ActivityStatusBadge status={displayedEntry.status} />
                                </div>

                                <DetailRow
                                    label={t('columns.actor')}
                                    value={displayedEntry.actorName ?? displayedEntry.actorEmail}
                                />
                                <DetailRow label={t('detail.actorRole')} value={displayedEntry.actorRole} />
                                <DetailRow
                                    label={t('detail.actorType')}
                                    value={t(`actorType.${displayedEntry.actorType}`)}
                                />
                                <DetailRow label={t('columns.source')} value={t(`source.${displayedEntry.source}`)} />
                                <DetailRow
                                    label={t('columns.target')}
                                    value={displayedEntry.targetName ?? displayedEntry.targetId}
                                />
                                <DetailRow label={t('detail.targetId')} value={displayedEntry.targetId} />
                                <DetailRow label={t('detail.organization')} value={displayedEntry.organizationId} />
                                <DetailRow label={t('detail.environment')} value={displayedEntry.environmentId} />
                                <DetailRow
                                    label={t('columns.duration')}
                                    value={
                                        displayedEntry.durationMs === null ? null : `${displayedEntry.durationMs} ms`
                                    }
                                />
                                <DetailRow label={t('detail.ipAddress')} value={displayedEntry.ipAddress} />
                                <DetailRow label={t('detail.userAgent')} value={displayedEntry.userAgent} />
                                {displayedEntry.errorMessage && (
                                    <div className="py-2">
                                        <Alert variant="destructive" className="border-destructive/40 bg-destructive/5">
                                            <AlertCircleIcon />
                                            <AlertTitle>{t('detail.error')}</AlertTitle>
                                            <AlertDescription>
                                                <span style={{ wordBreak: 'break-word' }}>
                                                    {displayedEntry.errorMessage}
                                                </span>
                                            </AlertDescription>
                                        </Alert>
                                    </div>
                                )}

                                {displayedEntry.metadata !== null && displayedEntry.metadata !== undefined && (
                                    <div className="flex flex-col gap-1 py-2">
                                        <span className="text-muted-foreground text-xs">{t('detail.metadata')}</span>
                                        <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
                                            {JSON.stringify(displayedEntry.metadata, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        </ScrollAreaWithShadow>
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}
