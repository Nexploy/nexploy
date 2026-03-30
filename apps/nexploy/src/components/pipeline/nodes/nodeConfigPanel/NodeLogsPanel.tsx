'use client';

import { useParams } from 'next/navigation';
import { useInngestSubscription } from '@inngest/realtime/hooks';
import dayjs from 'dayjs';
import useSWR from 'swr';
import { BuildLogEntry } from '@workspace/typescript-interface/inngest/build';
import { onGetTokenBuildIdAction } from '@/actions/inngest/tokenBuildId.action';
import { ScrollAreaWithShadow } from '@/components/ScrollAreaWithShadow';
import { getLogLevelColor, getLogLevelColorGradiant, parseAnsiColors } from '@/utils/color';
import { cn } from '@workspace/ui/lib/utils';
import { fetcherApi } from '@/lib/api/fetcherApi';
import { NodeRunStatus } from '@/types/pipeline.type';
import { useTranslations } from 'next-intl';
import { LogsToolbar } from '@/components/shared/LogsToolbar';
import { useLogsToolbar } from '@/hooks/useLogsToolbar';
import { StatusNodeLive } from '@/components/shared/StatusNodeLive';

interface NodeLogsPanelProps {
    buildId: string;
    nodeId: string;
    nodeStatus: NodeRunStatus | undefined;
}

export function NodeLogsPanel({ buildId, nodeId, nodeStatus }: NodeLogsPanelProps) {
    const t = useTranslations('repository.builds.logs');
    const params = useParams<{ repositoryId: string }>();

    const isLive = nodeStatus === 'running';

    const { data: initialLogs = [] } = useSWR<BuildLogEntry[]>(
        `/api/repositories/${params.repositoryId}/builds/${buildId}/nodes/${nodeId}/logs`,
        fetcherApi,
    );

    const { data: liveData } = useInngestSubscription({
        enabled: isLive,
        refreshToken: async () => {
            if (!isLive) return null;
            const result = await onGetTokenBuildIdAction({ buildId, topics: ['log'] });
            return result?.data ?? null;
        },
    });

    const liveLogs = liveData
        .filter((evt) => evt.topic === 'log' && evt.data?.log?.step === nodeId)
        .map((evt) => evt.data.log as BuildLogEntry);

    const logs = [...initialLogs, ...liveLogs];

    const {
        logsContainerRef,
        logsEndRef,
        showTimestamp,
        setShowTimestamp,
        autoScroll,
        setAutoScroll,
        downloadLogs,
    } = useLogsToolbar({
        logs,
        downloadFileName: `node-${nodeId.slice(-6)}-logs.txt`,
        localStorageKey: 'timestamp-build-log-node',
    });

    return (
        <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex items-center justify-between gap-2 border-b p-2">
                <StatusNodeLive buildId={buildId} nodeId={nodeId} initialStatus={nodeStatus} />
                <LogsToolbar
                    id="node-log-showTimestamp"
                    showTimestamp={showTimestamp}
                    onShowTimestampChange={setShowTimestamp}
                    hasLogs={logs.length > 0}
                    onDownload={downloadLogs}
                    autoScroll={autoScroll}
                    onAutoScrollToggle={() => setAutoScroll((prev) => !prev)}
                />
            </div>
            <ScrollAreaWithShadow
                ref={logsContainerRef}
                bottomShadow
                className="h-full font-mono text-xs"
            >
                {logs.length === 0 ? (
                    <div className="text-muted-foreground flex flex-1 items-center justify-center py-8">
                        {t('noLogs')}
                    </div>
                ) : (
                    <div className="space-y-0.5 px-2 pl-0">
                        {logs.map((log, i) => (
                            <div
                                key={`${log.createdAt}-${i}`}
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
                                    {parseAnsiColors(log.message).map((part, j) => (
                                        <span key={j} className={part.color}>
                                            {part.text}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                        <div ref={logsEndRef} />
                    </div>
                )}
            </ScrollAreaWithShadow>
        </div>
    );
}
