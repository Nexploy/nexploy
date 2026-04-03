'use client';

import * as React from 'react';
import { ReactNode, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@workspace/ui/components/dialog';
import { useContainerStore } from '@/stores/docker/useContainerStore';
import { Button } from '@workspace/ui/components/button';
import { Status, StatusIndicator, StatusLabel } from '@workspace/ui/components/kibo-ui/status';
import { Separator } from '@workspace/ui/components/separator';
import '@xterm/xterm/css/xterm.css';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { statusMap } from '@/utils/statusMap';
import { Terminal } from 'lucide-react';
import { useTerminalStore } from '@/stores/useTerminalStore';
import { useLocalStorage } from 'usehooks-ts';
import { useEnvironmentStore } from '@/stores/environment/useEnvironmentStore';
import { useTranslations } from 'next-intl';

interface ContainerTerminalProps {
    children: (props: { openConsole: () => void }) => ReactNode;
}

const shellKeys = ['auto', 'bash', 'sh', 'ash', 'dash'] as const;

export function ContainerTerminal({ children }: ContainerTerminalProps) {
    const [open, setOpen] = useState(false);
    const [selectedShell, setSelectedShell] = useLocalStorage('terminal-selectedShell', 'auto');
    const t = useTranslations('docker.containerTerminal');
    const tStatus = useTranslations('docker.status');

    const container = useContainerStore((state) => state.container);
    const selectedEnvironmentId = useEnvironmentStore((state) => state.selectedEnvironmentId);

    const { connectionState, connect, disconnect, terminalRef } = useTerminalStore();

    const buildSocketUrl = (shell: string) => {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const baseUrl = `${protocol}//${window.location.host}/api/ws/docker/terminal/${container?.id}/${shell}`;

        return selectedEnvironmentId ? `${baseUrl}?environment=${selectedEnvironmentId}` : baseUrl;
    };

    const socketUrl = buildSocketUrl(selectedShell);

    const handleOpen = async () => {
        setOpen(true);
        await connect(buildSocketUrl(selectedShell));
    };

    const handleClose = () => {
        setOpen(false);
        disconnect();
    };

    const handleReconnection = async () => {
        disconnect();
        await connect(socketUrl);
    };

    const onValueChange = async (shellCommand: string) => {
        setSelectedShell(shellCommand);
        disconnect();
        await connect(buildSocketUrl(shellCommand));
    };

    const currentStatus = statusMap[connectionState];
    const isConnected = connectionState === 'connected';

    return (
        <>
            {children({ openConsole: handleOpen })}
            <Dialog open={open} modal onOpenChange={handleClose}>
                <DialogContent
                    showCloseButton={false}
                    onOpenAutoFocus={(e) => e.preventDefault()}
                    aria-describedby={undefined}
                    className="gap-0 overflow-hidden border border-neutral-800 bg-black p-0 sm:max-w-5/6"
                >
                    <DialogHeader className="flex flex-row items-center justify-between border-b border-neutral-800 p-2 pl-3">
                        <div className="flex flex-row items-center gap-2">
                            <DialogTitle className="flex items-center gap-2 text-sm text-white">
                                <div className="flex size-4 items-center">
                                    <Terminal />
                                </div>
                                {t('title', { name: container?.name ?? 'Unknown Container' })}
                                <Status
                                    className="rounded-none bg-transparent"
                                    status={currentStatus.status}
                                >
                                    <StatusIndicator />
                                    <StatusLabel className={currentStatus.text}>
                                        {tStatus(currentStatus.labelKey)}
                                    </StatusLabel>
                                </Status>
                            </DialogTitle>
                        </div>
                        <div className="flex flex-row items-center gap-2">
                            <Select value={selectedShell} onValueChange={onValueChange}>
                                <SelectTrigger className="!h-7 bg-white/10 text-white/90">
                                    <SelectValue placeholder={t('shellPlaceholder')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>{t('shellLabel')}</SelectLabel>
                                        {shellKeys.map((shell) => (
                                            <SelectItem key={shell} value={shell}>
                                                {t(`shells.${shell}`)}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            <Button
                                onClick={handleReconnection}
                                className="h-7 text-xs"
                                disabled={isConnected}
                                variant="white"
                                size="sm"
                            >
                                {t('reconnect')}
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

                    <div ref={terminalRef} className="m-1 h-[400px]" />
                </DialogContent>
            </Dialog>
        </>
    );
}
