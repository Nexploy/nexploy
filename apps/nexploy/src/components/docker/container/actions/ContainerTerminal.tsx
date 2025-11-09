'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@workspace/ui/components/dialog';
import { useContainerStore } from '@/stores/docker/useContainerStore';
import { Button } from '@workspace/ui/components/button';
import { Status, StatusIndicator, StatusLabel } from '@workspace/ui/components/kibo-ui/status';
import { InputAutoComplete } from '@workspace/ui/components/search-command';
import { Separator } from '@workspace/ui/components/separator';
import '@xterm/xterm/css/xterm.css';
import { useContainerTerminal } from '@/hooks/useWebsocketTerminal';
import { useForm } from 'react-hook-form';

interface ContainerTerminalProps {
    children: (props: { openConsole: () => void }) => ReactNode;
}

interface FormData {
    shellCommand: string;
}

const SHELL_OPTIONS = [
    { value: 'auto', label: 'Auto (bash > ash > dash > sh)' },
    { value: 'bash', label: 'Bash' },
    { value: 'sh', label: 'Shell (sh)' },
    { value: 'ash', label: 'Ash (Alpine)' },
    { value: 'dash', label: 'Dash (Debian)' },
];

const STATUS_MAP = {
    connecting: { label: 'Connecting...', status: 'maintenance' as const },
    connected: { label: 'Online', status: 'online' as const },
    error: { label: 'Error', status: 'degraded' as const },
    disconnected: { label: 'Offline', status: 'offline' as const },
};

export function ContainerTerminal({ children }: ContainerTerminalProps) {
    const [open, setOpen] = useState(false);

    const termRef = useRef<HTMLDivElement>(null);
    const container = useContainerStore((state) => state.container);

    const { connectionState, openConnection, cleanup } = useContainerTerminal({
        terminalRef: termRef,
    });

    useEffect(() => {
        if (open) {
            openConnection('auto');
        }
    }, [open]);

    const { handleSubmit, watch, setValue } = useForm<FormData>();

    const shellCommand = watch('shellCommand');

    const handleOpen = () => setOpen(true);

    const handleClose = () => {
        cleanup();
        setOpen(false);
    };

    const onSubmit = (data: FormData) => {
        openConnection(data.shellCommand);
    };

    const currentStatus = STATUS_MAP[connectionState];
    const isConnecting = connectionState === 'connecting';

    return (
        <>
            {children({ openConsole: handleOpen })}
            <Dialog open={open} modal onOpenChange={handleClose}>
                <DialogContent
                    showCloseButton={false}
                    onOpenAutoFocus={(e) => e.preventDefault()}
                    className="gap-0 overflow-hidden border border-neutral-800 bg-black p-0 sm:max-w-5/6"
                >
                    <DialogHeader className="flex flex-row items-center justify-between border-b border-neutral-800 py-2 pr-2 pl-4">
                        <div className="flex flex-row items-center gap-2">
                            <DialogTitle className="text-sm text-white">
                                Console — {container?.name}
                            </DialogTitle>
                            <Status className="rounded-none bg-black" status={currentStatus.status}>
                                <StatusIndicator />
                                <StatusLabel>{currentStatus.label}</StatusLabel>
                            </Status>
                        </div>
                        <div className="flex flex-row items-center gap-2">
                            <form onSubmit={handleSubmit(onSubmit)} className="flex items-center">
                                <InputAutoComplete
                                    className="h-7 rounded-r-none"
                                    heading="Cmd"
                                    autoComplete="off"
                                    placeholder="auto, sh, bash, ash..."
                                    value={shellCommand}
                                    alwaysShowOptions
                                    onChange={(e) => setValue('shellCommand', e)}
                                    options={SHELL_OPTIONS}
                                />
                                <Button
                                    type="submit"
                                    disabled={isConnecting}
                                    className="h-7 rounded-l-none text-xs"
                                    variant="white"
                                    size="sm"
                                >
                                    Connect
                                </Button>
                            </form>
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
