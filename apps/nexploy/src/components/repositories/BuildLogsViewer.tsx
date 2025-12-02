'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@workspace/ui/components/button';
import { ArrowDown, ArrowUp, Download } from 'lucide-react';
import { useInngestSubscription } from '@inngest/realtime/hooks';
import { BuildStatus } from 'generated/client';
import dayjs from 'dayjs';
import { BuildLogEntry } from '@workspace/typescript-interface/inngest/build';
import { onGetTokenBuildIdAction } from '@/actions/inngest/tokenBuildId.action';
import { ScrollAreaWithShadow } from '@/components/ScrollAreaWithShadow';
import { getStatusBadge } from '@/components/utils/StatusBadge';
import { cn } from '@workspace/ui/lib/utils';

interface BuildLogsViewerProps {
    buildId: string;
    initialStatus: BuildStatus;
    initialLogs: BuildLogEntry[];
    createdAt: Date;
}

const getLogLevelColor = (level: string) => {
    switch (level) {
        case 'error':
            return 'text-red-500';
        case 'warn':
            return 'text-yellow-500';
        case 'debug':
            return 'text-muted-foreground/60';
        default:
            return 'text-foreground';
    }
};

const parseAnsiColors = (text: string) => {
    const ansiColorMap: Record<string, string> = {
        '30': 'text-current',
        '31': 'text-red-500',
        '32': 'text-green-500',
        '33': 'text-yellow-500',
        '34': 'text-blue-500',
        '35': 'text-purple-500',
        '36': 'text-cyan-500',
        '37': 'text-gray-300',
        '90': 'text-gray-500',
        '91': 'text-red-400',
        '92': 'text-green-400',
        '93': 'text-yellow-400',
        '94': 'text-blue-400',
        '95': 'text-purple-400',
        '96': 'text-cyan-400',
        '97': 'text-current',
    };

    const parts: Array<{ text: string; color?: string }> = [];
    let currentColor: string | undefined;
    let buffer = '';
    let i = 0;

    while (i < text.length) {
        const ansiMatch = text.slice(i).match(/^(?:\x1b)?\[(\d+)m/);

        if (ansiMatch) {
            if (buffer) {
                parts.push({ text: buffer, color: currentColor });
                buffer = '';
            }

            const code: any = ansiMatch[1];
            if (code === '0') {
                currentColor = undefined;
            } else {
                currentColor = ansiColorMap[code];
            }

            i += ansiMatch[0].length;
        } else {
            buffer += text[i];
            i++;
        }
    }

    if (buffer) {
        parts.push({ text: buffer, color: currentColor });
    }

    return parts;
};

export function BuildLogsViewer({
    buildId,
    initialStatus,
    initialLogs,
    createdAt,
}: BuildLogsViewerProps) {
    const [autoScroll, setAutoScroll] = useState(true);
    const logsEndRef = useRef<HTMLDivElement>(null);
    const logsContainerRef = useRef<HTMLDivElement>(null);
    const lastScrollTop = useRef<number>(0);

    const { latestData, data } = useInngestSubscription({
        refreshToken: async () => {
            const result = await onGetTokenBuildIdAction({
                buildId,
                topics: ['status', 'log'],
            });
            return result?.data ?? null;
        },
    });

    const liveLogs = data
        .filter((evt) => evt.topic === 'log' && evt.data?.log)
        .map((evt) => evt.data.log);

    const logs = [...initialLogs, ...liveLogs];
    const status: BuildStatus = latestData?.data.status ?? initialStatus;

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
    }, [logsContainerRef.current, autoScroll]);

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
                <div className="flex items-center gap-4">
                    {getStatusBadge(status)}
                    <span className="text-muted-foreground text-sm">
                        Started {dayjs(createdAt).format('DD/MM/YYYY HH:mm:ss')}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {logs.length > 0 && (
                        <Button size="sm" onClick={downloadLogs}>
                            <Download />
                            Download
                        </Button>
                    )}
                    <Button
                        size="sm"
                        icon={autoScroll ? ArrowDown : ArrowUp}
                        variant={autoScroll ? 'default' : 'white'}
                        onClick={() => setAutoScroll((prevState) => !prevState)}
                    >
                        {autoScroll ? 'Auto' : 'Manual'}
                    </Button>
                </div>
            </div>
            {logs.length === 0 ? (
                <div className="bg-muted/30 text-muted-foreground flex flex-1 items-center justify-center pb-12 font-mono text-sm">
                    <span>No logs available</span>
                </div>
            ) : (
                <ScrollAreaWithShadow
                    ref={logsContainerRef}
                    className="bg-muted/30 flex h-full font-mono text-sm"
                >
                    <div className="space-y-0.5 p-1 px-2">
                        {logs.map((log, index) => (
                            <div
                                key={index}
                                className={cn(
                                    'grid grid-cols-[auto_1fr] gap-2',
                                    getLogLevelColor(log.level),
                                )}
                            >
                                <div className={'text-muted-foreground flex gap-1'}>
                                    <span className="shrink-0 select-none">
                                        [{dayjs(log.createdAt).format('DD/MM/YYYY HH:mm:ss')}]
                                    </span>
                                    <span className="shrink-0 select-none">[{log.step}]</span>
                                </div>
                                {parseAnsiColors(log.message).map((part, partIndex) => (
                                    <span key={partIndex} className={part.color}>
                                        {part.text}
                                    </span>
                                ))}
                            </div>
                        ))}
                        <div ref={logsEndRef} />
                    </div>
                </ScrollAreaWithShadow>
            )}
        </div>
    );
}
