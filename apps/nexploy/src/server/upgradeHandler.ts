import type { IncomingMessage } from 'http';
import type { Socket } from 'net';
import type { Duplex } from 'stream';
import { getDockerApiProxy, getInngestProxy } from '@/server/proxies';
import { WS_PROXY_PREFIX, matchAndTransformWsUrl } from '@/server/wsRoutes';
import { authorizeContainerUpgrade } from '@/server/wsAuthorization';
import { handleRunnerUpgrade } from '@/server/runner/gateway';
import { RUNNER_WS_PATH } from '@/server/runner/protocol';
import { actorToHeaders } from '@nexploy/shared/actor';

export type NextUpgradeHandler = (req: IncomingMessage, socket: Duplex, head: Buffer) => Promise<void>;

let nextUpgradeHandler: NextUpgradeHandler | null = null;

export function setNextUpgradeHandler(handler: NextUpgradeHandler): void {
    nextUpgradeHandler = handler;
}

function denyUpgrade(socket: Socket, status: number, reason: string): void {
    socket.write(`HTTP/1.1 ${status} ${reason}\r\n\r\n`);
    socket.destroy();
}

export async function handleUpgrade(req: IncomingMessage, socket: Socket, head: Buffer): Promise<void> {
    const parsedUrl = new URL(req.url!, `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;

    try {
        if (pathname.startsWith('/_next/')) {
            if (nextUpgradeHandler) await nextUpgradeHandler(req, socket, head);
            else socket.destroy();
            return;
        }

        if (pathname === RUNNER_WS_PATH) {
            await handleRunnerUpgrade(req, socket, head);
            return;
        }

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
            const authorization = await authorizeContainerUpgrade(req, parsedUrl);
            if (!authorization.authorized) {
                denyUpgrade(socket, authorization.denial.status, authorization.denial.reason);
                return;
            }

            for (const [name, value] of Object.entries(actorToHeaders(authorization.actor))) {
                req.headers[name.toLowerCase()] = value;
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
