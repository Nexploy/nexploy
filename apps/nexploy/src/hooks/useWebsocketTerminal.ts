import { RefObject, useCallback, useRef, useState } from 'react';
import { useContainerStore } from '@/stores/docker/useContainerStore';

const DELAY_TIME = 60000;

type ConnectionState = 'connecting' | 'connected' | 'error' | 'disconnected';

interface UseContainerTerminalProps {
    terminalRef: RefObject<HTMLDivElement | null>;
}

interface TerminalInstance {
    write: (data: string | Uint8Array) => void;
    writeln: (data: string) => void;
    focus: () => void;
    dispose: () => void;
    onData: (callback: (data: string) => void) => { dispose: () => void };
}

interface FitAddonInstance {
    fit: () => void;
    dispose: () => void;
}

export function useContainerTerminal({ terminalRef }: UseContainerTerminalProps) {
    const containerId = useContainerStore((state) => state.containerId);

    const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');

    const socketRef = useRef<WebSocket | null>(null);
    const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastActivityRef = useRef<number>(Date.now());
    const terminalRef_internal = useRef<TerminalInstance | null>(null);
    const fitAddonRef = useRef<FitAddonInstance | null>(null);
    const cleanupFunctionRef = useRef<(() => void) | null>(null);
    const isConnectingRef = useRef<boolean>(false);

    const closeConnection = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
        }
    }, []);

    const resetInactivityTimer = useCallback(() => {
        lastActivityRef.current = Date.now();

        if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
        }

        inactivityTimerRef.current = setTimeout(() => {
            const elapsed = Date.now() - lastActivityRef.current;
            if (elapsed >= DELAY_TIME) {
                closeConnection();
                if (terminalRef_internal.current) {
                    terminalRef_internal.current.writeln(
                        `\r\n\n\x1b[31m*** Disconnected (inactive ${DELAY_TIME / 1000}s) ***\x1b[0m\r\n\n`,
                    );
                }
                setConnectionState('disconnected');
            }
        }, DELAY_TIME);
    }, [closeConnection]);

    const buildSocketUrl = useCallback(
        (shellCommand: string) => {
            if (!containerId) return '';
            const shell = shellCommand || 'auto';
            return `ws://${window.location.host}/api/ws/docker/terminal/${containerId}/${shell}`;
        },
        [containerId],
    );

    const initializeSocket = useCallback(
        (term: TerminalInstance, fitAddon: FitAddonInstance, shellCommand: string) => {
            const socketUrl = buildSocketUrl(shellCommand);

            const socket = new WebSocket(socketUrl);
            socket.binaryType = 'arraybuffer';
            socketRef.current = socket;

            socket.onopen = () => {
                resetInactivityTimer();
                setConnectionState('connected');
                isConnectingRef.current = false;
                fitAddon.fit();
            };

            socket.onmessage = (event) => {
                resetInactivityTimer();

                try {
                    const data = JSON.parse(event.data);
                    if (data && typeof data === 'object' && data.type === 'error') {
                        setConnectionState('error');
                        term.writeln(`\r\x1b[31m*** ${data.error} ***\x1b[0m\r\n`);
                        return;
                    }
                    if (typeof data === 'object') return;
                } catch {
                    /* empty */
                }

                if (typeof event.data === 'string') {
                    term.write(event.data);
                } else {
                    term.write(new Uint8Array(event.data));
                }
            };

            socket.onerror = () => {
                console.error('WebSocket error');
                setConnectionState('error');
                isConnectingRef.current = false;
            };

            socket.onclose = () => {
                setConnectionState('disconnected');
                isConnectingRef.current = false;
            };
        },
        [buildSocketUrl, resetInactivityTimer],
    );

    const cleanup = useCallback(() => {
        if (cleanupFunctionRef.current) {
            cleanupFunctionRef.current();
            cleanupFunctionRef.current = null;
        }

        closeConnection();

        if (terminalRef_internal.current) {
            terminalRef_internal.current.dispose();
            terminalRef_internal.current = null;
        }

        if (fitAddonRef.current) {
            fitAddonRef.current.dispose();
            fitAddonRef.current = null;
        }

        if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
            inactivityTimerRef.current = null;
        }

        isConnectingRef.current = false;
    }, [closeConnection]);

    const openConnection = (shellCommand: string) => {
        if (!containerId) return;

        cleanup();

        isConnectingRef.current = true;
        setConnectionState('connecting');

        (async () => {
            try {
                const { Terminal } = await import('@xterm/xterm');
                const { FitAddon } = await import('@xterm/addon-fit');

                const term = new Terminal({
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

                const fitAddon = new FitAddon();
                term.loadAddon(fitAddon);
                term.open(terminalRef.current!);
                fitAddon.fit();
                term.focus();

                terminalRef_internal.current = term;
                fitAddonRef.current = fitAddon;

                initializeSocket(term, fitAddon, shellCommand);

                const disposable = term.onData((data: string) => {
                    resetInactivityTimer();
                    if (socketRef.current?.readyState === WebSocket.OPEN) {
                        socketRef.current.send(data);
                    }
                });

                const handleResize = () => fitAddon.fit();
                window.addEventListener('resize', handleResize);

                const observer = new ResizeObserver(() => fitAddon.fit());
                observer.observe(terminalRef.current!);

                cleanupFunctionRef.current = () => {
                    window.removeEventListener('resize', handleResize);
                    disposable?.dispose?.();
                    observer?.disconnect?.();
                };
            } catch (error) {
                console.error("Erreur lors de l'initialisation du terminal:", error);
                setConnectionState('error');
                isConnectingRef.current = false;
            }
        })();
    };

    return {
        connectionState,
        closeConnection,
        openConnection,
        cleanup,
        resetInactivityTimer,
    };
}
