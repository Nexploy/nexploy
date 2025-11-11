'use client';

import * as React from 'react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@workspace/ui/components/dialog';
import { useContainerStore } from '@/stores/docker/useContainerStore';
import '@xterm/xterm/css/xterm.css';
import { Button } from '@workspace/ui/components/button';
import { Status, StatusIndicator, StatusLabel } from '@workspace/ui/components/kibo-ui/status';
import { Terminal } from 'lucide-react';
import { statusMap } from '@/utils/statusMap';
import { useTerminalStore } from '@/stores/useTerminalStore';
import { WebsocketProvider } from '@/providers/WebsocketProviders';

interface ContainerAttachProps {
    children: (props: { openAttach: () => void }) => React.ReactNode;
}

export function ContainerAttach({ children }: ContainerAttachProps) {
    const [open, setOpen] = useState(false);
    const container = useContainerStore((state) => state.container);

    const { connectionState, connect, disconnect, terminalRef } = useTerminalStore();

    const socketUrl = `ws://${window.location.host}/api/ws/docker/attach/${container?.id}`;

    const handleOpen = async () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleReconnect = async () => {
        disconnect();
        await connect(socketUrl);
    };

    const currentStatus = statusMap[connectionState];
    const isConnected = connectionState === 'connected';

    return (
        <>
            {children({ openAttach: handleOpen })}
            <Dialog modal open={open} onOpenChange={handleClose}>
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
                                    Attach — {container?.name}
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
                                <Button
                                    onClick={handleReconnect}
                                    disabled={isConnected}
                                    className="h-7 text-xs"
                                    variant="white"
                                    size="sm"
                                >
                                    Reconnect
                                </Button>
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
