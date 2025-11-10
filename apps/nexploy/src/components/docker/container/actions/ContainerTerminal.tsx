'use client';

import * as React from 'react';
import { ReactNode, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@workspace/ui/components/dialog';
import { useContainerStore } from '@/stores/docker/useContainerStore';
import { Button } from '@workspace/ui/components/button';
import { Status, StatusIndicator, StatusLabel } from '@workspace/ui/components/kibo-ui/status';
import { Separator } from '@workspace/ui/components/separator';
import '@xterm/xterm/css/xterm.css';
import { useContainerTerminal } from '@/hooks/useWebsocketTerminal';
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
    const [selectedShell, setSelectedShell] = useState('auto');

    const termRef = useRef<HTMLDivElement>(null);
    const container = useContainerStore((state) => state.container);

    const { connectionState, openConnection, cleanup } = useContainerTerminal({
        terminalRef: termRef,
    });

    const handleOpen = () => {
        setOpen(true);
        openConnection(selectedShell);
    };

    const handleClose = () => {
        cleanup();
        setOpen(false);
    };

    const handleReconnection = () => {
        cleanup();
        openConnection(selectedShell);
    };

    const onValueChange = (shellCommand: string) => {
        setSelectedShell(shellCommand);
        openConnection(shellCommand);
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
                    <DialogHeader className="flex flex-row items-center justify-between border-b border-neutral-800 p-2 pl-3">
                        <div className="flex flex-row items-center gap-2">
                            <DialogTitle className="flex items-center gap-2 text-sm text-white">
                                <Terminal className={'size-4'} /> Console — {container?.name}
                            </DialogTitle>
                            <Status className="rounded-none bg-black" status={currentStatus.status}>
                                <StatusIndicator />
                                <StatusLabel className={currentStatus.text}>
                                    {currentStatus.label}
                                </StatusLabel>
                            </Status>
                        </div>
                        <div className="flex flex-row items-center gap-2">
                            <Select value={selectedShell} onValueChange={onValueChange}>
                                <SelectTrigger className="!h-7 text-white">
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

                    <div ref={termRef} className="m-2 h-[400px]" />
                </DialogContent>
            </Dialog>
        </>
    );
}
