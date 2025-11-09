import { createServer } from 'http';
import { parse } from 'url';
import httpProxy from 'http-proxy';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || 3000, 10);

const app = next({
    dev,
    hostname,
    port,
    turbopack: dev,
});

const handle = app.getRequestHandler();

const proxy = httpProxy.createProxyServer({
    target: process.env.HONO_BACKEND_URL || 'http://localhost:3300',
    ws: true,
    changeOrigin: true,
    xfwd: true,
});

proxy.on('error', (err, req, res) => {
    console.error('❌ Proxy error:', err.message);
    if (res.writeHead) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Proxy error: ' + err.message);
    }
});

proxy.on('proxyReq', (proxyReq, req) => {
    console.log('📡 Proxying HTTP:', req.method, req.url);
});

proxy.on('proxyReqWs', (proxyReq, req, socket) => {
    console.log('🔌 Proxying WebSocket:', req.url);
});

const WS_ROUTES = [
    { prefix: '/api/ws/docker/terminal', target: '/ws/docker/terminal' },
    { prefix: '/api/ws/docker/attach', target: '/ws/docker/attach' },
];

function matchAndTransformWsUrl(pathname) {
    for (const route of WS_ROUTES) {
        if (pathname.startsWith(route.prefix)) {
            const transformed = pathname.replace(route.prefix, route.target);
            return { matched: true, url: transformed, original: pathname };
        }
    }
    return { matched: false };
}

app.prepare().then(() => {
    const server = createServer(async (req, res) => {
        try {
            const parsedUrl = parse(req.url, true);
            await handle(req, res, parsedUrl);
        } catch (err) {
            console.error('❌ Error handling request:', req.url, err);
            res.statusCode = 500;
            res.end('Internal server error');
        }
    });

    server.on('upgrade', async (req, socket, head) => {
        const parsedUrl = parse(req.url, true);
        const { pathname } = parsedUrl;

        try {
            if (dev && pathname.startsWith('/_next/webpack-hmr')) {
                return;
            }

            const result = matchAndTransformWsUrl(pathname);
            if (result.matched) {
                req.url = result.url;
                console.log('🔌 Proxying WebSocket:', result.original, '→', result.url);
                proxy.ws(req, socket, head);
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
        console.log(`🔌 WS Proxy configured routes:`);
        WS_ROUTES.forEach((route) => {
            console.log(
                `   ws://${hostname}:${port}${route.prefix}/* → ws://localhost:3300${route.target}/*`,
            );
        });
        console.log(`⚡ Mode: ${dev ? 'Development (Turbopack)' : 'Production'}\n`);
    });

    const shutdown = (signal) => {
        console.log(`\n${signal} received, closing server gracefully...`);
        proxy.close();
        server.close(() => {
            console.log('✅ Server closed');
            process.exit(0);
        });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
});
