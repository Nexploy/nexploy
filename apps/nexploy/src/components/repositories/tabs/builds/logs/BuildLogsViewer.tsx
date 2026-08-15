'use client';

import { BuildStatus } from 'generated/client';
import dayjs from 'dayjs';
import { BuildLogEntry } from '@workspace/typescript-interface/repository/build';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { StatusLive } from '@/components/shared/StatusLive';
import { cn } from '@workspace/ui/lib/utils';
import { getLogLevelColor, getLogLevelColorGradiant, parseAnsiColors } from '@/utils/color';
import { useTranslations } from 'next-intl';
import { LogsToolbar } from '@/components/shared/LogsToolbar';
import { useLogsToolbar } from '@/hooks/useLogsToolbar';
import type { BuildMessage } from '@workspace/typescript-interface/repository/buildRealtime';
import { DurationLive } from '@/components/shared/DurationLive.tsx';
import { Separator } from '@workspace/ui/components/separator.tsx';

interface BuildLogsViewerProps {
    inngestData: {
        data: BuildMessage[];
        latestData: BuildMessage | null;
    };
    buildId: string;
    initialStatus: BuildStatus;
    initialLogs: BuildLogEntry[];
    createdAt: Date;
    updatedAt: Date;
}

export function BuildLogsViewer({
    inngestData,
    buildId,
    initialStatus,
    initialLogs,
    createdAt,
    updatedAt,
}: BuildLogsViewerProps) {
    const t = useTranslations('repository.builds.logs');

    const liveLogs = inngestData.data.filter((evt) => evt.topic === 'log' && evt.data?.log).map((evt) => evt.data.log);

    const logs = [...initialLogs, ...liveLogs];

    const { logsContainerRef, logsEndRef, showTimestamp, setShowTimestamp, autoScroll, setAutoScroll, downloadLogs } =
        useLogsToolbar({ logs, downloadFileName: `build-${buildId.slice(-6)}-logs.txt` });

    return (
        <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b p-2">
                <div className="flex items-center gap-2">
                    <StatusLive key={buildId} buildId={buildId} initialStatus={initialStatus} />
                    <Separator orientation={'vertical'} className={'h-3! w-1'} />
                    <DurationLive
                        buildId={buildId}
                        initialStatus={initialStatus}
                        createdAt={createdAt}
                        updatedAt={updatedAt}
                    />
                    <Separator orientation={'vertical'} className={'h-3! w-1'} />
                    <span className="text-muted-foreground text-sm">
                        {t('started')} {dayjs(createdAt).format('DD/MM/YYYY HH:mm:ss')}
                    </span>
                </div>
                <LogsToolbar
                    id="build-log-showTimestamp"
                    showTimestamp={showTimestamp}
                    onShowTimestampChange={setShowTimestamp}
                    hasLogs={logs.length > 0}
                    onDownload={downloadLogs}
                    autoScroll={autoScroll}
                    onAutoScrollToggle={() => setAutoScroll((prev) => !prev)}
                />
            </div>
            {logs.length === 0 ? (
                <div className="flex flex-1 items-center justify-center bg-muted/30 pb-12 font-mono text-muted-foreground text-sm">
                    <span>{t('noLogs')}</span>
                </div>
            ) : (
                <ScrollAreaWithShadow ref={logsContainerRef} className="flex h-full bg-muted/30 font-mono text-sm">
                    <div className="space-y-0.5 pt-1 pr-2 pl-0">
                        {logs.map((log, logIndex) => (
                            <div
                                key={`${log.createdAt}-${logIndex}`}
                                className={cn(
                                    'grid grid-cols-[auto_1fr] gap-2 border-l pl-2',
                                    getLogLevelColor(log.level),
                                    getLogLevelColorGradiant(log.level),
                                )}
                            >
                                {showTimestamp && (
                                    <span className="shrink-0 select-none text-muted-foreground">
                                        [{dayjs(log.createdAt).format('DD/MM/YYYY HH:mm:ss')}]
                                    </span>
                                )}
                                <div className="min-w-0 whitespace-pre-wrap break-all">
                                    {parseAnsiColors(log.message).map((part, partIndex) => (
                                        <span key={partIndex} className={part.color} style={part.style}>
                                            {part.text}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                        <div ref={logsEndRef} />
                    </div>
                </ScrollAreaWithShadow>
            )}
        </div>
    );
}
