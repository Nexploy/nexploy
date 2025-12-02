import { RefObject } from 'react';

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

export interface TerminalState {
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
    disconnect: () => void;
    connect: (url?: string) => Promise<void>;
    initializeSocket: (
        socketUrl: string,
        term: TerminalInstance,
        fitAddon: FitAddonInstance,
    ) => void;
}
