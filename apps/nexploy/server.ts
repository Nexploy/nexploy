import { createServer, IncomingMessage, ServerResponse } from 'http';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import next from 'next';
import { terminalSchema } from '@workspace/schemas-zod/websocket/terminal.schema';
import { Socket } from 'net';
import { attachSchema } from '@workspace/schemas-zod/websocket/attach.schema';

const dev = process.env.NODE_ENV !== 'production';

const hostname = '0.0.0.0';
const port = 3000;

const app = next({
    dev,
    hostname,
    port,
    turbopack: dev,
});

const handle = app.getRequestHandler();

const proxyOptions: Options = {
    target: process.env.DOCKER_API_URL || 'http://localhost:3300',
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

interface WSRouteConfig {
    prefix: string;
    params: string[];
    paramSpecs: Record<string, { optional: boolean; default?: string }>;
    zodSchema: any | null;
    transform: (params: Record<string, string>) => string;
}

interface MatchResult {
    matched: boolean;
    url?: string;
    original?: string;
}

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

app.prepare().then(() => {
    if (typeof (global as any).gc === 'function') {
        setInterval(() => (global as any).gc(), 30_000);
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

    server.listen(port, hostname, () => {
        console.log(`🚀 Next.js:  http://${hostname}:${port}`);
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
