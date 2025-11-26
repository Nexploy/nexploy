'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@workspace/ui/components/dialog';
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { useBuildLogsStore, BuildLogEntry } from '@/stores/project/useBuildLogsStore';
import { useShallow } from 'zustand/shallow';
import { Spinner } from '@workspace/ui/components/spinner';
import { Status, StatusIndicator, StatusLabel } from '@workspace/ui/components/kibo-ui/status';
import { Button } from '@workspace/ui/components/button';
import { Separator } from '@workspace/ui/components/separator';
import { ArrowDown, ArrowUp, Download, Terminal } from 'lucide-react';
import { ScrollAreaWithShadow } from '@/components/ScrollAreaWithShadow';
import { cn } from '@workspace/ui/lib/utils';

interface BuildLogsProps {
    deploymentId: string;
    jobId: string;
    children: (props: { openLogs: () => void }) => ReactNode;
}

const statusMap: Record<string, { status: 'online' | 'offline' | 'maintenance' | 'degraded'; label: string; text: string }> = {
    disconnected: { status: 'offline', label: 'Disconnected', text: 'text-muted-foreground' },
    connecting: { status: 'maintenance', label: 'Connecting', text: 'text-yellow-500' },
    connected: { status: 'online', label: 'Connected', text: 'text-green-500' },
    error: { status: 'degraded', label: 'Error', text: 'text-red-500' },
};

const getLevelColor = (level: BuildLogEntry['level']) => {
    switch (level) {
        case 'error':
            return 'text-red-400';
        case 'warn':
            return 'text-yellow-400';
        case 'info':
            return 'text-blue-300';
        case 'debug':
            return 'text-neutral-500';
        default:
            return 'text-white';
    }
};

const getStepBadge = (step: string) => {
    const colors: Record<string, string> = {
        clone: 'bg-purple-500/30 text-purple-300',
        dockerfile: 'bg-blue-500/30 text-blue-300',
        env: 'bg-green-500/30 text-green-300',
        build: 'bg-orange-500/30 text-orange-300',
        deploy: 'bg-cyan-500/30 text-cyan-300',
        complete: 'bg-emerald-500/30 text-emerald-300',
        error: 'bg-red-500/30 text-red-300',
    };
    return colors[step] || 'bg-neutral-500/30 text-neutral-300';
};

function LogLine({ log }: { log: BuildLogEntry }) {
    const timestamp = new Date(log.timestamp).toLocaleTimeString();
    return (
        <div className="flex gap-2 py-0.5">
            <span className="shrink-0 text-neutral-500">{timestamp}</span>
            <span className={cn('shrink-0 rounded px-1.5 py-0.5 text-[10px] uppercase', getStepBadge(log.step))}>
                {log.step}
            </span>
            <span className={cn('flex-1 break-all', getLevelColor(log.level))}>{log.message}</span>
        </div>
    );
}

export function BuildLogs({ deploymentId, jobId, children }: BuildLogsProps) {
    const {
        logs,
        status,
        isLoading,
        error,
        autoScroll,
        setAutoScroll,
        downloadLogs,
        connectionState,
        messageEnd,
        connect,
        disconnect,
    } = useBuildLogsStore(useShallow((state) => state));

    const [open, setOpen] = useState(false);
    const logsEndRef = useRef<HTMLDivElement>(null);
    const logsContainerRef = useRef<HTMLDivElement>(null);
    const lastScrollTop = useRef<number>(0);

    const currentStatus = statusMap[connectionState] || statusMap.disconnected!;

    const handleOpen = () => {
        setOpen(true);
        connect({ jobId, deploymentId });
    };

    const handleClose = () => {
        setOpen(false);
        disconnect();
    };

    useEffect(() => {
        const logsContainer = logsContainerRef.current;
        if (!logsContainer || !open) return;

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
    }, [open, setAutoScroll]);

    useEffect(() => {
        if (!autoScroll || !logsEndRef.current || !open) return;

        const rafId = requestAnimationFrame(() => {
            logsEndRef.current?.scrollIntoView({ behavior: 'instant', block: 'end' });
        });

        return () => cancelAnimationFrame(rafId);
    }, [logs.length, autoScroll, open]);

    const handleDownload = useCallback(() => {
        downloadLogs('build');
    }, [downloadLogs]);

    return (
        <>
            {children({ openLogs: handleOpen })}
            <Dialog open={open} modal onOpenChange={handleClose}>
                <DialogContent
                    showCloseButton={false}
                    onOpenAutoFocus={(e) => e.preventDefault()}
                    className="gap-0 overflow-hidden border border-neutral-800 bg-black p-0 sm:max-w-5/6"
                >
                    <DialogHeader className="flex flex-row items-center justify-between border-b border-neutral-800 p-2 pl-3">
                        <div className="flex items-center gap-2">
                            <DialogTitle className="flex items-center gap-2 text-sm text-white">
                                <div className="flex size-4 items-center">
                                    <Terminal />
                                </div>
                                Build Logs — #{deploymentId.slice(-6)}
                            </DialogTitle>
                            <Status className="rounded-none bg-transparent" status={currentStatus.status}>
                                <StatusIndicator />
                                <StatusLabel className={currentStatus.text}>
                                    {currentStatus.label}
                                    {messageEnd && `: ${messageEnd}`}
                                </StatusLabel>
                            </Status>
                            {status && (
                                <span
                                    className={cn(
                                        'rounded px-2 py-0.5 text-xs font-medium uppercase',
                                        status === 'completed' && 'bg-green-500/20 text-green-400',
                                        status === 'failed' && 'bg-red-500/20 text-red-400',
                                        status === 'building' && 'bg-orange-500/20 text-orange-400',
                                        status === 'cloning' && 'bg-purple-500/20 text-purple-400',
                                        status === 'deploying' && 'bg-cyan-500/20 text-cyan-400',
                                        status === 'pending' && 'bg-neutral-500/20 text-neutral-400',
                                    )}
                                >
                                    {status}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={() => setAutoScroll(!autoScroll)}
                                disabled={logs.length === 0}
                                className="h-7 text-xs"
                                variant={autoScroll ? 'default' : 'white'}
                                icon={autoScroll ? ArrowDown : ArrowUp}
                                size="sm"
                            >
                                {autoScroll ? 'Auto' : 'Manual'}
                            </Button>
                            <Button
                                onClick={handleDownload}
                                disabled={logs.length === 0}
                                className="h-7 text-xs"
                                variant="white"
                                icon={Download}
                                size="sm"
                            >
                                Download
                            </Button>
                            <Separator orientation="vertical" className="!h-5 border-white bg-white/50" />
                            <Button onClick={handleClose} className="h-7 text-xs" variant="white" size="sm">
                                Close
                            </Button>
                        </div>
                    </DialogHeader>
                    <ScrollAreaWithShadow
                        ref={logsContainerRef}
                        colorShadow="from-black via-black/50"
                        bottomShadow
                        thumbColor="bg-[#282828] hover:bg-[#404040]"
                        className="mr-1.5 h-[600px] overflow-hidden font-mono text-xs"
                    >
                        <div className="p-2 pr-2.5">
                            {isLoading && logs.length === 0 ? (
                                <div className="text-secondary-foreground flex items-center gap-2">
                                    <Spinner />
                                    Loading logs...
                                </div>
                            ) : error ? (
                                <div className="text-destructive">
                                    <div className="font-semibold">Error:</div>
                                    <div className="mt-1">{error.message}</div>
                                </div>
                            ) : logs.length === 0 ? (
                                <div className="text-secondary-foreground">No logs available</div>
                            ) : (
                                <>
                                    {logs.map((log, index) => (
                                        <LogLine key={`${index}-${log.timestamp}`} log={log} />
                                    ))}
                                    <div ref={logsEndRef} />
                                </>
                            )}
                        </div>
                    </ScrollAreaWithShadow>
                </DialogContent>
            </Dialog>
        </>
    );
}
