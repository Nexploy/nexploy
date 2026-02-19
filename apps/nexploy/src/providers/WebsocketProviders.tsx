'use client';

import { PropsWithChildren, useEffect, useMemo } from 'react';
import { useTerminalStore } from '@/stores/useTerminalStore';
import { WebsocketChannel } from '@workspace/typescript-interface/websocket';

const DEFAULT_WS_PARAMS: WebsocketParams = {};

type ExtractConnectParams<T> = T extends (params: infer P) => void ? P : never;

type WebsocketParams = {
    terminal?: ExtractConnectParams<ReturnType<typeof useTerminalStore.getState>['connect']>;
};

interface WebsocketProviderProps extends PropsWithChildren {
    connections: WebsocketChannel[];
    params?: WebsocketParams;
}

export function WebsocketProvider({
    children,
    connections,
    params = DEFAULT_WS_PARAMS,
}: WebsocketProviderProps) {
    const memoizedConnections = useMemo(() => connections, [JSON.stringify(connections)]);
    const memoizedParams = useMemo(() => params, [JSON.stringify(params)]);

    const containerTerminalConnect = useTerminalStore((s) => s.connect);
    const containerTerminalDisconnect = useTerminalStore((s) => s.disconnect);

    useEffect(() => {
        const connectFns: Record<WebsocketChannel, (...args: any[]) => void> = {
            terminal: containerTerminalConnect,
        };

        const disconnectFns: Record<WebsocketChannel, (...args: any[]) => void> = {
            terminal: containerTerminalDisconnect,
        };

        memoizedConnections.forEach((conn) => {
            const param = memoizedParams[conn as keyof WebsocketParams];
            if (param !== undefined) connectFns[conn]?.(param);
            else connectFns[conn]?.();
        });

        return () => {
            memoizedConnections.forEach((conn) => {
                const param = memoizedParams[conn as keyof WebsocketParams];
                if (param !== undefined) disconnectFns[conn]?.(param);
                else disconnectFns[conn]?.();
            });
        };
    }, [
        memoizedParams,
        memoizedConnections,
        containerTerminalConnect,
        containerTerminalDisconnect,
    ]);

    return children;
}
