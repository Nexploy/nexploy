import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@workspace/ui/components/dialog';
import * as React from 'react';
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { useContainerStore } from '@/stores/docker/useContainerStore';
import { useContainerLogsStore } from '@/stores/docker/useContainerLogsStore';
import { useShallow } from 'zustand/shallow';
import { SSEProvider } from '@/providers/SSEProviders';
import { LogLine } from '@/components/docker/container/actions/logs/LogLine';
import { Spinner } from '@workspace/ui/components/spinner';
import { Status, StatusIndicator, StatusLabel } from '@workspace/ui/components/kibo-ui/status';
import { Button } from '@workspace/ui/components/button';
import { Separator } from '@workspace/ui/components/separator';
import { ArrowDown, ArrowUp, Download, FileText } from 'lucide-react';
import { ScrollAreaWithShadow } from '@/components/ScrollAreaWithShadow';
import { useLocalStorage } from 'usehooks-ts';
import { Switch } from '@workspace/ui/components/switch';
import { Label } from '@workspace/ui/components/label';
import { statusMap } from '@/utils/statusMap';
import { useTranslations } from 'next-intl';

interface ContainerLogsProps {
    children: (props: { openLogs: () => void }) => ReactNode;
}

export function ContainerLogs({ children }: ContainerLogsProps) {
    const container = useContainerStore((state) => state.container);
    const t = useTranslations('docker.containerLogs');
    const tStatus = useTranslations('docker.status');

    const {
        logs,
        isLoading,
        error,
        autoScroll,
        setAutoScroll,
        downloadLogs,
        connectionState,
        messageEnd,
    } = useContainerLogsStore(useShallow((state) => state));

    const [showTimestamp, setShowTimestamp] = useLocalStorage('timestamp-container-log', true);

    const [open, setOpen] = useState(false);
    const logsEndRef = useRef<HTMLDivElement>(null);
    const logsContainerRef = useRef<HTMLDivElement>(null);
    const lastScrollTop = useRef<number>(0);

    const currentStatus = statusMap[connectionState];

    const handleOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
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
    }, [logsContainerRef.current, autoScroll, open]);

    useEffect(() => {
        if (!autoScroll || !logsEndRef.current || !open) return;

        const rafId = requestAnimationFrame(() => {
            logsEndRef.current?.scrollIntoView({ behavior: 'instant', block: 'end' });
        });

        return () => cancelAnimationFrame(rafId);
    }, [logs.length, autoScroll, open]);

    const handleDownload = useCallback(() => {
        downloadLogs(container?.name);
    }, [container?.name, downloadLogs]);

    return (
        <>
            {children({ openLogs: handleOpen })}
            <Dialog open={open} modal onOpenChange={handleClose}>
                <DialogContent
                    showCloseButton={false}
                    onOpenAutoFocus={(e) => e.preventDefault()}
                    className="gap-0 overflow-hidden border border-neutral-800 bg-black p-0 sm:max-w-5/6"
                >
                    <SSEProvider
                        connections={['logs']}
                        params={{ logs: { containerId: container!.id, tail: 50 } }}
                    >
                        <DialogHeader className="flex flex-row items-center justify-between border-b border-neutral-800 p-2 pl-3">
                            <div className={'flex items-center gap-2'}>
                                <DialogTitle className="flex items-center gap-2 text-sm text-white">
                                    <div className="flex size-4 items-center">
                                        <FileText />
                                    </div>
                                    {t('title', { name: container?.name ?? 'Unknown Container' })}
                                </DialogTitle>
                                <Status
                                    className="rounded-none bg-transparent"
                                    status={currentStatus.status}
                                >
                                    <StatusIndicator />
                                    <StatusLabel className={currentStatus.text}>
                                        {tStatus(currentStatus.labelKey)}
                                        {messageEnd && `: ${messageEnd}`}
                                    </StatusLabel>
                                </Status>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center space-x-2">
                                    <Label
                                        htmlFor="log-showTimestamp"
                                        className={'text-xs text-white'}
                                    >
                                        {t('showTimestamp')}
                                    </Label>
                                    <Switch
                                        id="log-showTimestamp"
                                        onCheckedChange={(checked) => setShowTimestamp(checked)}
                                        defaultChecked={showTimestamp}
                                    >
                                        setShowTimestamp
                                    </Switch>
                                </div>
                                <Button
                                    onClick={() => setAutoScroll(!autoScroll)}
                                    disabled={logs.length === 0}
                                    className="h-7 text-xs"
                                    variant={autoScroll ? 'default' : 'white'}
                                    icon={autoScroll ? ArrowDown : ArrowUp}
                                    size="sm"
                                >
                                    {autoScroll ? t('auto') : t('manual')}
                                </Button>
                                <Button
                                    onClick={handleDownload}
                                    disabled={logs.length === 0}
                                    className="h-7 text-xs"
                                    variant="white"
                                    icon={Download}
                                    size="sm"
                                >
                                    {t('download')}
                                </Button>
                                <Separator
                                    orientation="vertical"
                                    className="!h-5 border-white bg-white/50"
                                />
                                <Button
                                    onClick={handleClose}
                                    className="h-7 text-xs"
                                    variant="white"
                                    size="sm"
                                >
                                    {t('close')}
                                </Button>
                            </div>
                        </DialogHeader>
                        <ScrollAreaWithShadow
                            ref={logsContainerRef}
                            colorShadow={'from-black via-black/50'}
                            bottomShadow
                            thumbColor={'bg-[#282828] hover:bg-[#404040]'}
                            className="h-[600px] overflow-hidden font-mono text-xs"
                        >
                            <div className={'mr-1 p-2 py-1'}>
                                {isLoading && logs.length === 0 ? (
                                    <div className="text-secondary-foreground flex items-center gap-2">
                                        <Spinner />
                                        {t('loading')}
                                    </div>
                                ) : error ? (
                                    <div className="text-destructive">
                                        <div className="font-semibold">{t('error')}</div>
                                        <div className="mt-1">{error.message}</div>
                                    </div>
                                ) : logs.length === 0 ? (
                                    <div className="text-secondary-foreground">{t('noLogs')}</div>
                                ) : (
                                    <>
                                        {logs.map((log, index) => (
                                            <LogLine
                                                key={`${index}-${log.timestamp}`}
                                                log={log}
                                                showTimestamp={showTimestamp}
                                            />
                                        ))}
                                        <div ref={logsEndRef} />
                                    </>
                                )}
                            </div>
                        </ScrollAreaWithShadow>
                    </SSEProvider>
                </DialogContent>
            </Dialog>
        </>
    );
}
