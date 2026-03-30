'use client';

import { BuildStatus } from 'generated/client';
import dayjs from 'dayjs';
import { BuildLogEntry } from '@workspace/typescript-interface/inngest/build';
import { ScrollAreaWithShadow } from '@/components/ScrollAreaWithShadow';
import { StatusLive } from '@/components/shared/StatusLive';
import { cn } from '@workspace/ui/lib/utils';
import { onGetTokenBuildIdAction } from '@/actions/inngest/tokenBuildId.action';
import { Realtime } from '@inngest/realtime';
import { getLogLevelColor, getLogLevelColorGradiant, parseAnsiColors } from '@/utils/color';
import { useTranslations } from 'next-intl';
import { LogsToolbar } from '@/components/shared/LogsToolbar';
import { useLogsToolbar } from '@/hooks/useLogsToolbar';

type BuildToken = NonNullable<Awaited<ReturnType<typeof onGetTokenBuildIdAction>>['data']>;
type BuildMessage = Realtime.Subscribe.Token.InferMessage<BuildToken>;

interface BuildLogsViewerProps {
    inngestData: {
        data: BuildMessage[];
        latestData: BuildMessage | null;
    };
    buildId: string;
    initialStatus: BuildStatus;
    initialLogs: BuildLogEntry[];
    createdAt: Date;
}

export function BuildLogsViewer({
    inngestData,
    buildId,
    initialStatus,
    initialLogs,
    createdAt,
}: BuildLogsViewerProps) {
    const t = useTranslations('repository.builds.logs');

    const liveLogs = inngestData.data
        .filter((evt) => evt.topic === 'log' && evt.data?.log)
        .map((evt) => evt.data.log);

    const logs = [...initialLogs, ...liveLogs];

    const {
        logsContainerRef,
        logsEndRef,
        showTimestamp,
        setShowTimestamp,
        autoScroll,
        setAutoScroll,
        downloadLogs,
    } = useLogsToolbar({ logs, downloadFileName: `build-${buildId.slice(-6)}-logs.txt` });

    return (
        <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b p-3">
                <div className="flex items-center gap-3">
                    <StatusLive key={buildId} buildId={buildId} initialStatus={initialStatus} />
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
                <div className="bg-muted/30 text-muted-foreground flex flex-1 items-center justify-center pb-12 font-mono text-sm">
                    <span>{t('noLogs')}</span>
                </div>
            ) : (
                <ScrollAreaWithShadow
                    ref={logsContainerRef}
                    className="bg-muted/30 flex h-full font-mono text-sm"
                >
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
                                    <span className="text-muted-foreground shrink-0 select-none">
                                        [{dayjs(log.createdAt).format('DD/MM/YYYY HH:mm:ss')}]
                                    </span>
                                )}
                                <div className="min-w-0 break-all whitespace-pre-wrap">
                                    {parseAnsiColors(log.message).map((part, partIndex) => (
                                        <span key={partIndex} className={part.color}>
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
