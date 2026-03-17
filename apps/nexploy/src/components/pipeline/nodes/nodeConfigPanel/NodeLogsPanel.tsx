'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { useInngestSubscription } from '@inngest/realtime/hooks';
import { useTranslations } from 'next-intl';
import dayjs from 'dayjs';
import { BuildLogEntry } from '@workspace/typescript-interface/inngest/build';
import { onGetTokenBuildIdAction } from '@/actions/inngest/tokenBuildId.action';
import { ScrollAreaWithShadow } from '@/components/ScrollAreaWithShadow';
import { getLogLevelColor, getLogLevelColorGradiant, parseAnsiColors } from '@/utils/color';
import { cn } from '@workspace/ui/lib/utils';
import { NodeRunStatus } from '@/types/pipeline.type';

interface NodeLogsPanelProps {
    buildId: string;
    nodeId: string;
    nodeStatus: NodeRunStatus | undefined;
}

export function NodeLogsPanel({ buildId, nodeId, nodeStatus }: NodeLogsPanelProps) {
    const t = useTranslations('repository.pipeline.nodeDialog');
    const params = useParams<{ repositoryId: string }>();
    const [initialLogs, setInitialLogs] = useState<BuildLogEntry[]>([]);
    const logsEndRef = useRef<HTMLDivElement>(null);

    const isLive = nodeStatus === 'running';

    useEffect(() => {
        fetch(`/api/repositories/${params.repositoryId}/builds/${buildId}/nodes/${nodeId}/logs`)
            .then((r) => r.json())
            .then((data: BuildLogEntry[]) => setInitialLogs(data));
    }, [buildId, nodeId, params.repositoryId]);

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

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'instant', block: 'end' });
    }, [logs.length]);

    if (logs.length === 0) {
        return (
            <div className="text-muted-foreground flex flex-1 items-center justify-center py-8 font-mono text-xs">
                {t('noLogs')}
            </div>
        );
    }

    return (
        <ScrollAreaWithShadow bottomShadow className="h-full font-mono text-xs">
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
                        <span className="text-muted-foreground shrink-0 select-none">
                            [{dayjs(log.createdAt).format('HH:mm:ss')}]
                        </span>
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
        </ScrollAreaWithShadow>
    );
}
