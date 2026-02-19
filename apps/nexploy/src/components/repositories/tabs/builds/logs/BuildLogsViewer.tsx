'use client';

import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@workspace/ui/components/button';
import { ArrowDown, ArrowUp, Download } from 'lucide-react';
import { BuildStatus } from 'generated/client';
import dayjs from 'dayjs';
import { BuildLogEntry } from '@workspace/typescript-interface/inngest/build';
import { ScrollAreaWithShadow } from '@/components/ScrollAreaWithShadow';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { cn } from '@workspace/ui/lib/utils';
import { onGetTokenBuildIdAction } from '@/actions/inngest/tokenBuildId.action';
import { Realtime } from '@inngest/realtime';
import { useLocalStorage } from 'usehooks-ts';
import { Label } from '@workspace/ui/components/label';
import { Switch } from '@workspace/ui/components/switch';
import { getLogLevelColor, getLogLevelColorGradiant, parseAnsiColors } from '@/utils/color';
import { useTranslations } from 'next-intl';

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
    const [autoScroll, setAutoScroll] = useState(true);
    const logsEndRef = useRef<HTMLDivElement>(null);
    const logsContainerRef = useRef<HTMLDivElement>(null);
    const lastScrollTop = useRef<number>(0);

    const [showTimestamp, setShowTimestamp] = useLocalStorage('timestamp-build-log', false);

    const liveLogs = inngestData.data
        .filter((evt) => evt.topic === 'log' && evt.data?.log)
        .map((evt) => evt.data.log);

    const logs = [...initialLogs, ...liveLogs];
    const status: BuildStatus = inngestData.latestData?.data.status ?? initialStatus;

    useEffect(() => {
        const logsContainer = logsContainerRef.current;
        if (!logsContainer) return;

        const handleScroll = () => {
            const scrollHeight = logsContainer.scrollHeight;
            const scrollTop = logsContainer.scrollTop;
            const clientHeight = logsContainer.clientHeight;
            const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);

            if (distanceFromBottom <= 5) {
                setAutoScroll(true);
            } else if (scrollTop < lastScrollTop.current) {
                setAutoScroll(false);
            }

            lastScrollTop.current = scrollTop;
        };

        logsContainer.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            logsContainer.removeEventListener('scroll', handleScroll);
        };
    }, []);

    useEffect(() => {
        if (!autoScroll || !logsEndRef.current) return;

        const rafId = requestAnimationFrame(() => {
            logsEndRef.current?.scrollIntoView({ behavior: 'instant', block: 'end' });
        });

        return () => cancelAnimationFrame(rafId);
    }, [logs.length, autoScroll]);

    const downloadLogs = () => {
        const logsText = logs
            .map(
                (log) =>
                    `[${new Date(log.createdAt).toISOString()}] [${log.step}] [${log.level}] ${log.message}`,
            )
            .join('\n');

        const blob = new Blob([logsText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `build-${buildId.slice(-6)}-logs.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b p-3">
                <div className="flex items-center gap-3">
                    <StatusBadge status={status} />
                    <span className="text-muted-foreground text-sm">
                        {t('started')} {dayjs(createdAt).format('DD/MM/YYYY HH:mm:ss')}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center space-x-2">
                        <Label htmlFor="log-showTimestamp" className={'cursor-pointer text-xs'}>
                            {t('showDate')}
                        </Label>
                        <Switch
                            id="log-showTimestamp"
                            className={'cursor-pointer'}
                            onCheckedChange={(checked) => setShowTimestamp(checked)}
                            defaultChecked={showTimestamp}
                        />
                    </div>
                    {logs.length > 0 && (
                        <Button size="sm" onClick={downloadLogs}>
                            <Download />
                            {t('download')}
                        </Button>
                    )}
                    <Button
                        size="sm"
                        icon={autoScroll ? ArrowDown : ArrowUp}
                        variant={autoScroll ? 'default' : 'white'}
                        onClick={() => setAutoScroll((prevState) => !prevState)}
                    >
                        {autoScroll ? t('auto') : t('manual')}
                    </Button>
                </div>
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
                                <div className={cn('overflow-hidden break-words')}>
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
