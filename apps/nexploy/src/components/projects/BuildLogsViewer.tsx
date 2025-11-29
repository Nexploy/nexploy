'use client';

import { useEffect, useRef, useState } from 'react';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { CheckCircle2, Clock, Download, Loader2, RotateCcw, XCircle } from 'lucide-react';
import { useInngestSubscription } from '@inngest/realtime/hooks';
import { BuildStatus } from 'generated/client';
import dayjs from 'dayjs';
import { BuildLogEntry } from '@workspace/typescript-interface/inngest/build';
import { onGetTokenDeploymenIdAction } from '@/actions/inngest/tokenDeploymenId';

interface BuildLogsViewerProps {
    deploymentId: string;
    initialStatus: BuildStatus;
    createdAt: Date;
}

const isActiveStatus = (status: BuildStatus) =>
    ['QUEUED', 'BUILDING', 'pending', 'cloning', 'building', 'deploying'].includes(status);

const getStatusBadge = (status: BuildStatus) => {
    switch (status) {
        case 'COMPLETED':
            return (
                <Badge variant="default" className="gap-1">
                    <CheckCircle2 className="size-3" />
                    Completed
                </Badge>
            );
        case 'FAILED':
            return (
                <Badge variant="destructive" className="gap-1">
                    <XCircle className="size-3" />
                    Failed
                </Badge>
            );
        case 'BUILDING':
            return (
                <Badge variant="warning" className="animate-pulse gap-1">
                    <Loader2 className="size-3 animate-spin" />
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                </Badge>
            );
        case 'QUEUED':
            return (
                <Badge variant="secondary" className="gap-1">
                    <Clock className="size-3" />
                    Queued
                </Badge>
            );
        default:
            return <Badge variant="outline">{status}</Badge>;
    }
};

export function BuildLogsViewer({ deploymentId, initialStatus, createdAt }: BuildLogsViewerProps) {
    const [logs, setLogs] = useState<BuildLogEntry[]>([]);
    const [status, setStatus] = useState<BuildStatus>(initialStatus);
    const [autoScroll, setAutoScroll] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const logsEndRef = useRef<HTMLDivElement>(null);
    const logsContainerRef = useRef<HTMLDivElement>(null);
    const lastLogTimestampRef = useRef<number>(0);

    const isActive = isActiveStatus(status);

    const { latestData } = useInngestSubscription({
        enabled: isActive && !isLoading,
        refreshToken: async () => {
            const result = await onGetTokenDeploymenIdAction({
                deploymentId,
                topics: ['status', 'logs'],
            });
            return result?.data ?? null;
        },
    });

    useEffect(() => {
        if (latestData?.data) {
            const data = latestData.data as { log?: BuildLogEntry; status?: BuildStatus };
            if (data.log) {
                const logTimestamp = new Date(data.log.createdAt).getTime();
                if (logTimestamp > lastLogTimestampRef.current) {
                    lastLogTimestampRef.current = logTimestamp;
                    setLogs((prev) => [...prev, data.log!]);
                }
            }
            if (data.status) {
                setStatus(data.status);
            }
        }
    }, [latestData]);

    useEffect(() => {
        if (autoScroll && logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs, autoScroll]);

    const handleScroll = () => {
        if (!logsContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = logsContainerRef.current;
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
        setAutoScroll(isAtBottom);
    };

    const scrollToBottom = () => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        setAutoScroll(true);
    };

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
        a.download = `build-${deploymentId.slice(-6)}-logs.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

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

    return (
        <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b px-5 py-3">
                <div className="flex items-center gap-4">
                    {getStatusBadge(status)}
                    <span className="text-muted-foreground text-sm">
                        Started {new Date(createdAt).toLocaleString()}
                    </span>
                    {isActive && (
                        <span className="text-muted-foreground flex items-center gap-1 text-xs">
                            <span className="relative flex size-2">
                                <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-75" />
                                <span className="relative inline-flex size-2 rounded-full bg-green-500" />
                            </span>
                            Live
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {logs.length > 0 && (
                        <Button variant="outline" size="sm" onClick={downloadLogs}>
                            <Download className="mr-1.5 size-3.5" />
                            Download
                        </Button>
                    )}
                    {!autoScroll && (
                        <Button variant="outline" size="sm" onClick={scrollToBottom}>
                            <RotateCcw className="mr-1.5 size-3.5" />
                            Scroll to bottom
                        </Button>
                    )}
                </div>
            </div>

            <div
                ref={logsContainerRef}
                onScroll={handleScroll}
                className="bg-muted/30 flex-1 overflow-y-auto p-4 font-mono text-sm"
            >
                {isLoading ? (
                    <div className="text-muted-foreground flex h-full items-center justify-center">
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="size-6 animate-spin" />
                            <span>Loading logs...</span>
                        </div>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="text-muted-foreground flex h-full items-center justify-center">
                        {isActive ? (
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="size-6 animate-spin" />
                                <span>Waiting for logs...</span>
                            </div>
                        ) : (
                            <span>No logs available</span>
                        )}
                    </div>
                ) : (
                    <div className="space-y-0.5">
                        {logs.map((log, index) => (
                            <div
                                key={index}
                                className={`flex gap-2 ${getLogLevelColor(log.level)}`}
                            >
                                <span className="text-muted-foreground/50 shrink-0 select-none">
                                    {dayjs(log.createdAt).format('DD/MM/YYYY HH:mm:ss')}
                                </span>
                                <span className="text-muted-foreground shrink-0 select-none">
                                    [{log.step}]
                                </span>
                                <span className="break-all">{log.message}</span>
                            </div>
                        ))}
                        <div ref={logsEndRef} />
                    </div>
                )}
            </div>
        </div>
    );
}
