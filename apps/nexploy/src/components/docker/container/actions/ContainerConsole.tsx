'use client';

import { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';
import { useContainerStore } from '@/stores/docker/useContainerStore';

// Singleton pour éviter les doubles connexions en StrictMode
const terminalInstances = new Map<
    string,
    {
        terminal: Terminal;
        socket: WebSocket;
        refCount: number;
    }
>();

export function ContainerConsole() {
    const termRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState<string | null>(null);
    const container = useContainerStore((state) => state.container);

    useEffect(() => {
        if (!termRef.current || !container?.id) return;

        const instanceKey = `terminal-${container.id}`;

        // Réutiliser l'instance existante si elle existe
        if (terminalInstances.has(instanceKey)) {
            const instance = terminalInstances.get(instanceKey)!;
            instance.refCount++;

            // Rattacher le terminal au nouveau DOM
            if (!instance.terminal.element) {
                instance.terminal.open(termRef.current);
            }

            console.log('♻️ Reusing existing terminal instance');

            return () => {
                instance.refCount--;
                if (instance.refCount === 0) {
                    console.log('🧹 Cleaning up terminal instance');
                    instance.socket.close();
                    instance.terminal.dispose();
                    terminalInstances.delete(instanceKey);
                }
            };
        }

        // Créer une nouvelle instance
        console.log('🚀 Creating new terminal instance');

        const term = new Terminal({
            cursorBlink: true,
            fontSize: 14,
            fontFamily: 'Menlo, Monaco, "Courier New", monospace',
            theme: {
                background: '#0a0a0a',
                foreground: '#ffffff',
                cursor: '#ffffff',
            },
            rows: 24,
            cols: 80,
        });

        term.open(termRef.current);
        term.focus();

        const socketUrl = `ws://localhost:3300/ws/docker/terminal/${container.id}`;
        const socket = new WebSocket(socketUrl);
        socket.binaryType = 'arraybuffer';

        const disposable = term.onData((data) => {
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(data);
            }
        });

        socket.onopen = () => {
            console.log('✅ WebSocket connected');
            term.writeln('\r\n\x1b[32m*** Connected to container ***\x1b[0m\r\n');
            setError(null);
        };

        socket.onmessage = (event) => {
            if (typeof event.data === 'string') {
                term.write(event.data);
            } else {
                term.write(new Uint8Array(event.data));
            }
        };

        socket.onerror = () => setError('Connection error');
        socket.onclose = (event) => {
            console.log('🔌 WebSocket closed:', event.code);
            term.writeln('\r\n\x1b[33m*** Session ended ***\x1b[0m\r\n');
        };

        // Stocker l'instance
        terminalInstances.set(instanceKey, {
            terminal: term,
            socket,
            refCount: 1,
        });

        return () => {
            const instance = terminalInstances.get(instanceKey);
            if (instance) {
                instance.refCount--;
                if (instance.refCount === 0) {
                    console.log('🧹 Cleaning up terminal instance');
                    disposable.dispose();
                    socket.close();
                    term.dispose();
                    terminalInstances.delete(instanceKey);
                }
            }
        };
    }, [container?.id]);

    return (
        <div className="flex flex-col gap-2">
            {error && (
                <div className="rounded-md border border-red-500 bg-red-900/20 p-2 text-sm text-red-400">
                    ⚠️ {error}
                </div>
            )}
            <div
                ref={termRef}
                className="h-96 w-full overflow-hidden rounded-md border border-gray-700 bg-black p-2"
                style={{ resize: 'vertical', minHeight: '256px', maxHeight: '80vh' }}
            />
        </div>
    );
}
