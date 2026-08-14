import { create } from 'zustand';
import { TerminalState } from '@workspace/typescript-interface/stores/terminalStore';

const INACTIVITY_TIMEOUT = 60000;

const createDefaultValue = () =>
    ({
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
    }) as const;

const parseControlFrame = (data: unknown): { type: string; error?: string } | null => {
    if (typeof data !== 'string') return null;

    try {
        const parsed = JSON.parse(data);

        if (parsed && typeof parsed === 'object' && typeof parsed.type === 'string') return parsed;

        return null;
    } catch {
        return null;
    }
};

export const useTerminalStore = create<TerminalState>((set, get) => ({
    ...createDefaultValue(),

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

    disconnect: () => {
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

        set({ ...createDefaultValue(), terminalRef: state.terminalRef, socketUrl: state.socketUrl });
    },

    connect: async (url) => {
        try {
            if (get().terminalInstance) {
                get().disconnect();
            }

            const { Terminal } = await import('@xterm/xterm');
            const { FitAddon } = await import('@xterm/addon-fit');

            const terminalElement = get().terminalRef.current;
            const socketUrl = url ?? get().socketUrl;

            if (!terminalElement) {
                set({ connectionState: 'error', isConnecting: false });
                return;
            }

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
            term.open(terminalElement);
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
            observer.observe(terminalElement);

            set({
                cleanupFunction: () => {
                    window.removeEventListener('resize', handleResize);
                    disposable?.dispose?.();
                    observer?.disconnect?.();
                },
            });
        } catch (error) {
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

            const controlFrame = parseControlFrame(event.data);

            if (controlFrame?.type === 'error') {
                set({ connectionState: 'error' });
                term.writeln(`\r\x1b[31m*** ${controlFrame.error} ***\x1b[0m\r\n`);
                return;
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
