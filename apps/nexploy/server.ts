import 'dotenv/config';
import { createServer, IncomingMessage, ServerResponse } from 'http';
import next from 'next';
import { isDev, nextHostname, port, resolveStandaloneConf } from '@/server/config';
import { pruneTurbopackCache } from '@/server/turbopackCache';
import { handleUpgrade } from '@/server/upgradeHandler';
import {
    ensureTraefikReady,
    registerGracefulShutdown,
    startHeapMonitor,
    trackOpenSockets,
} from '@/server/lifecycle';

const app = next({
    dev: isDev,
    hostname: nextHostname,
    port,
    turbopack: isDev,
    conf: resolveStandaloneConf(),
});

const handle = app.getRequestHandler();

pruneTurbopackCache();

app.prepare().then(async () => {
    await ensureTraefikReady();
    startHeapMonitor();

    const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
        try {
            await handle(req, res);
        } catch (err) {
            console.error('❌ Error handling request:', req.url, err);
            res.statusCode = 500;
            res.end('Internal server error');
        }
    });

    const openSockets = trackOpenSockets(server);

    server.on('upgrade', handleUpgrade);

    server.once('error', (err) => {
        console.error('❌ Server error:', err);
        process.exit(1);
    });

    server.listen(port, '0.0.0.0', () => {
        console.log(`🚀 Next.js:  http://0.0.0.0:${port}`);
        console.log(`🔌 WS Proxy configured routes`);
        console.log(`⚡ Mode: ${isDev ? 'Development (Turbopack)' : 'Production'}`);
    });

    registerGracefulShutdown(server, openSockets);
});
