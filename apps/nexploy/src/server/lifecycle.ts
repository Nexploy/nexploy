import type { Server } from 'http';
import type { Socket } from 'net';

const HEAP_SOFT_LIMIT_MB = Number(process.env.HEAP_SOFT_LIMIT_MB ?? 3200);
const HEAP_CHECK_INTERVAL_MS = 15_000;
const FORCED_SHUTDOWN_TIMEOUT_MS = 5000;

export async function ensureTraefikReady(): Promise<void> {
    const { ensureTraefikSetup } = await import('@/lib/traefik/setup');

    try {
        await ensureTraefikSetup();
        console.log(
            `✓ Traefik config directory ready: ${process.env.TRAEFIK_SERVICE_DIR ?? '(default)'}`,
        );
    } catch (err) {
        console.error('❌ Failed to set up Traefik config directory:', err);
        process.exit(1);
    }
}

export function startHeapMonitor(): void {
    if (typeof (global as any).gc !== 'function') return;

    const timer = setInterval(() => {
        const heapUsedMb = process.memoryUsage().heapUsed / 1024 / 1024;
        if (heapUsedMb > HEAP_SOFT_LIMIT_MB) {
            (global as any).gc();
        }
    }, HEAP_CHECK_INTERVAL_MS);

    timer.unref();
}

export function trackOpenSockets(server: Server): Set<Socket> {
    const openSockets = new Set<Socket>();

    server.on('connection', (socket: Socket) => {
        openSockets.add(socket);
        socket.once('close', () => openSockets.delete(socket));
    });

    return openSockets;
}

export function registerGracefulShutdown(server: Server, openSockets: Set<Socket>): void {
    let isShuttingDown = false;

    const shutdown = (signal: string) => {
        if (isShuttingDown) return;
        isShuttingDown = true;

        console.log(`\n${signal} received, closing server gracefully...`);

        server.close(() => {
            process.exit(0);
        });

        for (const socket of openSockets) socket.destroy();

        setTimeout(() => {
            console.error('⏱ Forced shutdown after timeout');
            process.exit(1);
        }, FORCED_SHUTDOWN_TIMEOUT_MS).unref();
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}
