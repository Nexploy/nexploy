import type { IncomingMessage } from 'http';
import type { Socket } from 'net';
import { isDev } from '@/server/config';
import { getDockerApiProxy, getInngestProxy } from '@/server/proxies';
import { WS_PROXY_PREFIX, matchAndTransformWsUrl } from '@/server/wsRoutes';
import { authorizeContainerUpgrade } from '@/server/wsAuthorization';

function denyUpgrade(socket: Socket, status: number, reason: string): void {
    socket.write(`HTTP/1.1 ${status} ${reason}\r\n\r\n`);
    socket.destroy();
}

export async function handleUpgrade(
    req: IncomingMessage,
    socket: Socket,
    head: Buffer,
): Promise<void> {
    const parsedUrl = new URL(req.url!, `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;

    try {
        if (isDev && pathname.startsWith('/_next/webpack-hmr')) return;

        if (pathname.startsWith('/v1/realtime/')) {
            console.log('🔌 Proxying Inngest realtime WS:', pathname);
            getInngestProxy().upgrade(req, socket, head);
            return;
        }

        const result = matchAndTransformWsUrl(pathname);
        if (!result.matched) {
            console.warn('⚠️ Unhandled upgrade request:', pathname);
            denyUpgrade(socket, 400, 'Bad Request');
            return;
        }

        if (pathname.startsWith(WS_PROXY_PREFIX)) {
            const denial = await authorizeContainerUpgrade(req, parsedUrl);
            if (denial) {
                denyUpgrade(socket, denial.status, denial.reason);
                return;
            }
        }

        req.url = result.url! + parsedUrl.search;
        console.log('🔌 Proxying WebSocket:', result.original, '→', req.url);
        getDockerApiProxy().upgrade(req, socket, head);
    } catch (err) {
        console.error('❌ Error during upgrade:', err);
        socket.destroy();
    }
}
