'use client';

import * as React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@workspace/ui/components/dialog';
import { useContainerStore } from '@/stores/docker/useContainerStore';
import '@xterm/xterm/css/xterm.css';
import { Button } from '@workspace/ui/components/button';
import { Status, StatusIndicator, StatusLabel } from '@workspace/ui/components/kibo-ui/status';

interface ContainerAttachProps {
    children: (props: { openAttach: () => void }) => React.ReactNode;
}

const INACTIVITY_TIMEOUT = 60000;

export function ContainerAttach({ children }: ContainerAttachProps) {
    const [open, setOpen] = useState(false);
    const [isTerminalMounted, setIsTerminalMounted] = useState(false);
    const termRef = useRef<HTMLDivElement>(null);
    const container = useContainerStore((state) => state.container);

    const [connectionState, setConnectionState] = useState<
        'connecting' | 'connected' | 'error' | 'disconnected'
    >('disconnected');

    const socketRef = useRef<WebSocket | null>(null);
    const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastActivityRef = useRef<number>(Date.now());

    const resetInactivityTimer = (term: any) => {
        lastActivityRef.current = Date.now();
        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = setTimeout(() => {
            const now = Date.now();
            if (now - lastActivityRef.current >= INACTIVITY_TIMEOUT) {
                socketRef.current?.close();
                socketRef.current = null;
                term.writeln(
                    `\r\n\n\x1b[31m*** Disconnected (inactive ${INACTIVITY_TIMEOUT / 1000}s) ***\x1b[0m\r\n\n`,
                );
                setConnectionState('disconnected');
            }
        }, INACTIVITY_TIMEOUT);
    };

    const setupTerminal = useCallback(() => {
        if (!isTerminalMounted || !container?.id) return;

        let term: any;
        let fitAddon: any;
        let socket: WebSocket | null = null;
        let disposable: any;
        let observer: ResizeObserver | null = null;

        (async () => {
            const { Terminal } = await import('@xterm/xterm');
            const { FitAddon } = await import('@xterm/addon-fit');

            term = new Terminal({
                cursorBlink: true,
                fontSize: 14,
                allowTransparency: true,
                fontFamily: 'Menlo, Monaco, "Courier New", monospace',
                theme: {
                    background: '#000000',
                    foreground: '#ffffff',
                    cursor: '#ffffff',
                },
            });

            fitAddon = new FitAddon();
            term.loadAddon(fitAddon);
            term.open(termRef.current!);
            fitAddon.fit();
            term.focus();

            const socketUrl = `ws://${window.location.host}/api/ws/docker/attach/${container.id}`;
            socketRef.current = socket = new WebSocket(socketUrl);
            socket.binaryType = 'arraybuffer';

            disposable = term.onData((data: string) => {
                resetInactivityTimer(term);
                if (socketRef.current === null) handleReconnect();
                if (socket && socket.readyState === WebSocket.OPEN) socket.send(data);
            });

            socket.onopen = () => {
                resetInactivityTimer(term);
                setConnectionState('connected');
                fitAddon.fit();
            };

            socket.onmessage = (event) => {
                resetInactivityTimer(term);

                try {
                    const data = JSON.parse(event.data);
                    console.log(data);

                    if (data && typeof data === 'object' && data.type === 'error') {
                        setConnectionState('error');
                        term.writeln(`\r\x1b[31m*** ${data.error} ***\x1b[0m\r\n`);
                        return;
                    }
                    if (typeof data === 'object') return;
                } catch {
                    /* empty */
                }

                if (typeof event.data === 'string') term.write(event.data);
                else term.write(new Uint8Array(event.data));
            };

            socket.onerror = () => {
                setConnectionState('error');
            };

            socket.onclose = () => {
                setConnectionState('disconnected');
            };

            const handleResize = () => fitAddon.fit();
            window.addEventListener('resize', handleResize);
            observer = new ResizeObserver(() => fitAddon.fit());
            observer.observe(termRef.current!);

            return () => {
                window.removeEventListener('resize', handleResize);
            };
        })();

        return () => {
            socketRef.current?.close?.();
            socketRef.current = null;
            disposable?.dispose?.();
            observer?.disconnect?.();
            term?.dispose?.();
            if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
        };
    }, [isTerminalMounted, container?.id]);

    useEffect(() => {
        if (!open) {
            setIsTerminalMounted(false);
            setConnectionState('disconnected');
            return;
        }
        const cleanup = setupTerminal();

        setIsTerminalMounted(true);
        setConnectionState('connecting');
        return () => cleanup?.();
    }, [open, setupTerminal]);

    const openAttach = () => setOpen(true);

    const handleReconnect = () => {
        setConnectionState('connecting');
        setIsTerminalMounted(false);
        setTimeout(() => setIsTerminalMounted(true), 100);
    };

    const statusMap: Record<
        typeof connectionState,
        { label: string; status: 'online' | 'offline' | 'maintenance' | 'degraded' }
    > = {
        connecting: { label: 'Connecting...', status: 'maintenance' },
        connected: { label: 'Online', status: 'online' },
        error: { label: 'Error', status: 'degraded' },
        disconnected: { label: 'Offline', status: 'offline' },
    };

    const currentStatus = statusMap[connectionState];

    return (
        <>
            {children({ openAttach })}
            <Dialog modal open={open} onOpenChange={setOpen}>
                <DialogContent
                    showCloseButton={false}
                    className="gap-0 overflow-hidden border border-neutral-800 bg-black p-0 sm:max-w-5/6"
                >
                    <DialogHeader className="flex flex-row items-center justify-between border-b border-neutral-800 py-2 pr-2 pl-4">
                        <div className="flex flex-row items-center gap-2">
                            <DialogTitle className="text-sm text-white">
                                Attach — {container?.name}
                            </DialogTitle>
                            <Status className="rounded-none bg-black" status={currentStatus.status}>
                                <StatusIndicator />
                                <StatusLabel>{currentStatus.label}</StatusLabel>
                            </Status>
                        </div>
                        <div className="flex flex-row items-center gap-2">
                            <Button
                                onClick={handleReconnect}
                                disabled={connectionState === 'connected'}
                                className="h-7 text-xs"
                                variant="white"
                                size="sm"
                            >
                                Reconnect
                            </Button>
                            <Button
                                onClick={() => setOpen(false)}
                                className="h-7 text-xs"
                                variant="white"
                                size="sm"
                            >
                                Close
                            </Button>
                        </div>
                    </DialogHeader>

                    {isTerminalMounted && <div ref={termRef} className="m-2" />}
                </DialogContent>
            </Dialog>
        </>
    );
}
