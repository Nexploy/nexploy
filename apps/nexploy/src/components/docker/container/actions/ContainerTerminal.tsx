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
import { WebsocketProvider } from '@/providers/WebsocketProviders';

interface ContainerTerminalProps {
    children: (props: { openConsole: () => void }) => ReactNode;
}

const shellOptions = [
    { value: 'auto', label: 'Auto (bash > ash > dash > sh)' },
    { value: 'bash', label: 'Bash' },
    { value: 'sh', label: 'Shell (sh)' },
    { value: 'ash', label: 'Ash (Alpine)' },
    { value: 'dash', label: 'Dash (Debian)' },
];

export function ContainerTerminal({ children }: ContainerTerminalProps) {
    const [open, setOpen] = useState(false);
    const [selectedShell, setSelectedShell] = useLocalStorage('terminal-selectedShell', 'auto');

    const container = useContainerStore((state) => state.container);

    const { connectionState, connect, disconnect, terminalRef } = useTerminalStore();

    const socketUrl = `ws://${window.location.host}/api/ws/docker/terminal/${container?.id}/${selectedShell}`;

    const handleOpen = async () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleReconnection = async () => {
        disconnect();
        await connect(socketUrl);
    };

    const onValueChange = async (shellCommand: string) => {
        setSelectedShell(shellCommand);
        disconnect();
        await connect(
            `ws://${window.location.host}/api/ws/docker/terminal/${container?.id}/${shellCommand}`,
        );
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
                    className="gap-0 overflow-hidden border border-neutral-800 bg-black p-0 sm:max-w-5/6"
                >
                    <WebsocketProvider connections={['terminal']} params={{ terminal: socketUrl }}>
                        <DialogHeader className="flex flex-row items-center justify-between border-b border-neutral-800 p-2 pl-3">
                            <div className="flex flex-row items-center gap-2">
                                <DialogTitle className="flex items-center gap-2 text-sm text-white">
                                    <div className="flex size-4 items-center">
                                        <Terminal />
                                    </div>
                                    Console — {container?.name}
                                    <Status
                                        className="rounded-none bg-transparent"
                                        status={currentStatus.status}
                                    >
                                        <StatusIndicator />
                                        <StatusLabel className={currentStatus.text}>
                                            {currentStatus.label}
                                        </StatusLabel>
                                    </Status>
                                </DialogTitle>
                            </div>
                            <div className="flex flex-row items-center gap-2">
                                <Select value={selectedShell} onValueChange={onValueChange}>
                                    <SelectTrigger className="!h-7 bg-white/10 text-white/90">
                                        <SelectValue placeholder="auto, sh, bash, ash..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectLabel>Shell cmd</SelectLabel>
                                            {shellOptions.map((option, index) => (
                                                <SelectItem key={index} value={option.value}>
                                                    {option.label}
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
                                    Reconnect
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
                                    Close
                                </Button>
                            </div>
                        </DialogHeader>

                        <div ref={terminalRef} className="m-2 h-[400px]" />
                    </WebsocketProvider>
                </DialogContent>
            </Dialog>
        </>
    );
}
