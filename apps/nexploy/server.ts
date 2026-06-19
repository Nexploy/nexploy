import 'dotenv/config';
import { createServer, IncomingMessage, ServerResponse } from 'http';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { existsSync, readdirSync, rmSync, statSync } from 'fs';
import { join } from 'path';
import next from 'next';
import { terminalSchema } from '@workspace/schemas-zod/websocket/terminal.schema';
import { Socket } from 'net';
import { attachSchema } from '@workspace/schemas-zod/websocket/attach.schema';
import type { MatchResult, WSRouteConfig } from '@workspace/typescript-interface/websocket';

const dev = process.env.NODE_ENV !== 'production';

const port = parseInt(process.env.NEXPLOY_PORT || '3000', 10);
const nextHostname = dev ? '0.0.0.0' : 'localhost';

const app = next({
    dev,
    hostname: nextHostname,
    port,
    turbopack: dev,
    conf: dev ? undefined : { output: 'standalone' },
});

const handle = app.getRequestHandler();

const MAX_TURBOPACK_CACHE_GB = Number(process.env.MAX_TURBOPACK_CACHE_GB ?? 3);
const TURBOPACK_CACHE_DIR = join(import.meta.dirname, '.next', 'dev', 'cache', 'turbopack');

function dirSizeBytes(dir: string): number {
    let total = 0;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        try {
            if (entry.isDirectory()) {
                total += dirSizeBytes(full);
            } else if (entry.isFile()) {
                total += statSync(full).size;
            }
        } catch {}
    }
    return total;
}

function pruneTurbopackCache(): void {
    if (!dev || !existsSync(TURBOPACK_CACHE_DIR)) return;
    try {
        const sizeGb = dirSizeBytes(TURBOPACK_CACHE_DIR) / 1024 ** 3;
        if (sizeGb > MAX_TURBOPACK_CACHE_GB) {
            console.warn(
                `🧹 Turbopack cache is ${sizeGb.toFixed(1)}GB (> ${MAX_TURBOPACK_CACHE_GB}GB), clearing it…`,
            );
            rmSync(TURBOPACK_CACHE_DIR, { recursive: true, force: true });
        }
    } catch (err) {
        console.error('⚠️ Failed to inspect/prune Turbopack cache:', err);
    }
}

const proxyOptions: Options = {
    target: process.env.DOCKER_API_URL,
    changeOrigin: true,
    ws: true,
    on: {
        error: (err) => {
            console.error('❌ Proxy error:', err.message);
        },
        proxyReq: (_, req) => {
            console.log('📡 Proxying HTTP:', req.method, req.url);
        },
        proxyReqWs: (proxyReq, req) => {
            console.log('🔌 Proxying WebSocket:', req.url);
            if (process.env.DOCKER_API_KEY) {
                proxyReq.setHeader('Authorization', `Bearer ${process.env.DOCKER_API_KEY}`);
            }
        },
    },
};

const proxy = createProxyMiddleware(proxyOptions);

const inngestProxy = createProxyMiddleware({
    target: process.env.INNGEST_BASE_URL,
    changeOrigin: true,
    ws: true,
    on: {
        error: (err) => {
            console.error('❌ Inngest proxy error:', err.message);
        },
    },
});

const WS_ROUTE_CONFIGS: WSRouteConfig[] = [
    {
        prefix: '/api/ws/docker/terminal',
        params: ['containerId', 'shell'],
        paramSpecs: {
            containerId: { optional: false },
            shell: { optional: true, default: 'auto' },
        },
        zodSchema: terminalSchema,
        transform: (params) => `/ws/docker/terminal/${params.containerId}/${params.shell}`,
    },
    {
        prefix: '/api/ws/docker/attach',
        params: ['containerId'],
        paramSpecs: {
            containerId: { optional: false },
        },
        zodSchema: attachSchema,
        transform: (params) => `/ws/docker/attach/${params.containerId}`,
    },
];

function matchAndTransformWsUrl(pathname: string): MatchResult {
    for (const config of WS_ROUTE_CONFIGS) {
        if (pathname.startsWith(config.prefix)) {
            const suffix = pathname.substring(config.prefix.length);
            if (config.params.length === 0) {
                if (suffix === '') {
                    return { matched: true, url: config.transform({}), original: pathname };
                }
                continue;
            }

            const parts = suffix.split('/').filter(Boolean);
            const paramsObj: Record<string, string | undefined> = {};
            for (let i = 0; i < config.params.length; i++) {
                const paramName = config.params[i] as string;
                const spec = config.paramSpecs[paramName];
                if (i < parts.length) {
                    paramsObj[paramName] = parts[i];
                } else if (spec?.optional && spec?.default !== undefined) {
                    paramsObj[paramName] = spec.default;
                } else {
                    return { matched: false };
                }
            }
            if (config.zodSchema) {
                const validation = config.zodSchema.safeParse(paramsObj);
                if (!validation.success) {
                    console.error(`Error validation ${pathname}:`, validation.error.format());
                    return { matched: false };
                }
            }
            return {
                matched: true,
                url: config.transform(paramsObj as Record<string, string>),
                original: pathname,
            };
        }
    }
    return { matched: false };
}

pruneTurbopackCache();

app.prepare().then(() => {
    const HEAP_SOFT_LIMIT_MB = Number(process.env.HEAP_SOFT_LIMIT_MB ?? 3200);
    if (typeof (global as any).gc === 'function') {
        const timer = setInterval(() => {
            const heapUsedMb = process.memoryUsage().heapUsed / 1024 / 1024;
            if (heapUsedMb > HEAP_SOFT_LIMIT_MB) {
                (global as any).gc();
            }
        }, 15_000);
        timer.unref();
    }

    const openSockets = new Set<Socket>();

    const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
        try {
            await handle(req, res);
        } catch (err) {
            console.error('❌ Error handling request:', req.url, err);
            res.statusCode = 500;
            res.end('Internal server error');
        }
    });

    server.on('connection', (socket: Socket) => {
        openSockets.add(socket);
        socket.once('close', () => openSockets.delete(socket));
    });

    server.on('upgrade', (req: IncomingMessage, socket: Socket, head: Buffer) => {
        const parsedUrl = new URL(req.url!, `http://${req.headers.host}`);
        const pathname = parsedUrl.pathname;

        try {
            if (dev && pathname?.startsWith('/_next/webpack-hmr')) return;

            if (pathname?.startsWith('/v1/realtime/')) {
                console.log('🔌 Proxying Inngest realtime WS:', pathname);
                inngestProxy.upgrade(req, socket, head);
                return;
            }

            const result = matchAndTransformWsUrl(pathname!);
            if (result.matched) {
                const queryString = parsedUrl.search;
                req.url = result.url! + queryString;
                console.log('🔌 Proxying WebSocket:', result.original, '→', req.url);
                proxy.upgrade(req, socket, head);
                return;
            }

            console.warn('⚠️ Unhandled upgrade request:', pathname);
            socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
            socket.destroy();
        } catch (err) {
            console.error('❌ Error during upgrade:', err);
            socket.destroy();
        }
    });

    server.once('error', (err) => {
        console.error('❌ Server error:', err);
        process.exit(1);
    });

    server.listen(port, '0.0.0.0', () => {
        console.log(`🚀 Next.js:  http://0.0.0.0:${port}`);
        console.log(`🔌 WS Proxy configured routes`);
        console.log(`⚡ Mode: ${dev ? 'Development (Turbopack)' : 'Production'}`);
    });

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
        }, 5000).unref();
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
});
