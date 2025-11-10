import { create } from 'zustand';
import { RefObject } from 'react';

const INACTIVITY_TIMEOUT = 60000;

type ConnectionState = 'connecting' | 'connected' | 'error' | 'disconnected';

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

interface TerminalState {
    connectionState: ConnectionState;
    socketRef: WebSocket | null;
    terminalInstance: TerminalInstance | null;
    fitAddon: FitAddonInstance | null;
    inactivityTimer: NodeJS.Timeout | null;
    lastActivity: number;
    cleanupFunction: (() => void) | null;
    isConnecting: boolean;
    terminalRef: RefObject<HTMLDivElement | null>;
    socketUrl: string | null;

    setConnectionState: (state: ConnectionState) => void;
    setSocket: (socket: WebSocket | null) => void;
    setTerminal: (terminal: TerminalInstance | null) => void;
    setFitAddon: (fitAddon: FitAddonInstance | null) => void;
    setInactivityTimer: (timer: NodeJS.Timeout | null) => void;
    setLastActivity: (time: number) => void;
    setCleanupFunction: (fn: (() => void) | null) => void;
    setIsConnecting: (connecting: boolean) => void;
    setTerminalRef: (ref: RefObject<HTMLDivElement | null>) => void;
    setSocketUrl: (url: string) => void;

    closeConnection: () => void;
    resetInactivityTimer: () => void;
    cleanup: () => void;
    openConnection: (url?: string) => Promise<void>;
    initializeSocket: (
        socketUrl: string,
        term: TerminalInstance,
        fitAddon: FitAddonInstance,
    ) => void;
}

const defaultValue = {
    connectionState: 'disconnected',
    socketRef: null,
    terminalInstance: null,
    fitAddon: null,
    inactivityTimer: null,
    lastActivity: Date.now(),
    cleanupFunction: null,
    isConnecting: false,
    terminalRef: { current: null },
    socketUrl: null,
} as const;

export const useTerminalStore = create<TerminalState>((set, get) => ({
    ...defaultValue,

    setConnectionState: (state) => set({ connectionState: state }),
    setSocket: (socket) => set({ socketRef: socket }),
    setTerminal: (terminal) => set({ terminalInstance: terminal }),
    setFitAddon: (fitAddon) => set({ fitAddon }),
    setInactivityTimer: (timer) => set({ inactivityTimer: timer }),
    setLastActivity: (time) => set({ lastActivity: time }),
    setCleanupFunction: (fn) => set({ cleanupFunction: fn }),
    setIsConnecting: (connecting) => set({ isConnecting: connecting }),
    setTerminalRef: (ref) => set({ terminalRef: ref }),
    setSocketUrl: (url) => set({ socketUrl: url }),

    closeConnection: () => {
        const { socketRef } = get();
        if (socketRef) {
            socketRef.close();
            set({ socketRef: null });
        }
    },

    resetInactivityTimer: () => {
        const state = get();
        set({ lastActivity: Date.now() });

        if (state.inactivityTimer) {
            clearTimeout(state.inactivityTimer);
        }

        const timer = setTimeout(() => {
            const elapsed = Date.now() - get().lastActivity;
            if (elapsed >= INACTIVITY_TIMEOUT) {
                get().closeConnection();
                if (state.terminalInstance) {
                    state.terminalInstance.writeln(
                        `\r\n\n\x1b[31m*** Disconnected (inactive ${INACTIVITY_TIMEOUT / 1000}s) ***\x1b[0m\r\n\n`,
                    );
                }
                set({ connectionState: 'disconnected' });
            }
        }, INACTIVITY_TIMEOUT);

        set({ inactivityTimer: timer });
    },

    cleanup: () => {
        const state = get();

        if (state.cleanupFunction) {
            state.cleanupFunction();
        }

        state.closeConnection();

        if (state.terminalInstance) {
            state.terminalInstance.dispose();
        }

        if (state.fitAddon) {
            state.fitAddon.dispose();
        }

        if (state.inactivityTimer) {
            clearTimeout(state.inactivityTimer);
        }

        set(defaultValue);
    },

    openConnection: async (url) => {
        try {
            const { Terminal } = await import('@xterm/xterm');
            const { FitAddon } = await import('@xterm/addon-fit');

            const terminalRef = get().terminalRef;
            const socketUrl = url ?? get().socketUrl;

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

            set({
                terminalInstance: term,
                fitAddon: fitAddon,
            });

            if (socketUrl) {
                get().initializeSocket(socketUrl, term, fitAddon);
            }

            const disposable = term.onData((data: string) => {
                get().resetInactivityTimer();
                const socket = get().socketRef;
                if (socket?.readyState === WebSocket.OPEN) {
                    socket.send(data);
                }
            });

            const handleResize = () => fitAddon.fit();
            window.addEventListener('resize', handleResize);

            const observer = new ResizeObserver(() => fitAddon.fit());
            observer.observe(terminalRef.current!);

            set({
                cleanupFunction: () => {
                    window.removeEventListener('resize', handleResize);
                    disposable?.dispose?.();
                    observer?.disconnect?.();
                },
            });
        } catch (error) {
            console.error('Erreur :', error);
            set({ connectionState: 'error', isConnecting: false });
        }
    },

    initializeSocket: (socketUrl, term, fitAddon) => {
        const socket = new WebSocket(socketUrl);
        socket.binaryType = 'arraybuffer';
        set({ socketRef: socket });

        socket.onopen = () => {
            get().resetInactivityTimer();
            set({ connectionState: 'connected', isConnecting: false });
            fitAddon.fit();
        };

        socket.onmessage = (event) => {
            get().resetInactivityTimer();

            try {
                const data = JSON.parse(event.data);
                if (data && typeof data === 'object' && data.type === 'error') {
                    set({ connectionState: 'error' });
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
            set({ connectionState: 'error', isConnecting: false });
        };

        socket.onclose = () => {
            set({ connectionState: 'disconnected', isConnecting: false });
        };
    },
}));
