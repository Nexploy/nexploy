import { createProxyMiddleware, Options, RequestHandler } from 'http-proxy-middleware';

let dockerApiProxy: RequestHandler | null = null;
let inngestProxy: RequestHandler | null = null;

const dockerApiProxyOptions = (): Options => ({
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
            if (process.env.NEXPLOY_API_KEY) {
                proxyReq.setHeader('Authorization', `Bearer ${process.env.NEXPLOY_API_KEY}`);
            }
        },
    },
});

const inngestProxyOptions = (): Options => ({
    target: process.env.INNGEST_BASE_URL,
    changeOrigin: true,
    ws: true,
    on: {
        error: (err) => {
            console.error('❌ Inngest proxy error:', err.message);
        },
    },
});

export function getDockerApiProxy(): RequestHandler {
    dockerApiProxy ??= createProxyMiddleware(dockerApiProxyOptions());
    return dockerApiProxy;
}

export function getInngestProxy(): RequestHandler {
    inngestProxy ??= createProxyMiddleware(inngestProxyOptions());
    return inngestProxy;
}
