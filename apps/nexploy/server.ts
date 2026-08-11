import '@/server/asyncLocalStorage';
import 'dotenv/config';
import { createServer, IncomingMessage, Server, ServerResponse } from 'http';
import next from 'next';
import { isDev, nextHostname, port, resolveStandaloneConf } from '@/server/config';
import { pruneTurbopackCache } from '@/server/turbopackCache';
import { handleUpgrade, setNextUpgradeHandler, type NextUpgradeHandler } from '@/server/upgradeHandler';
import { ensureTraefikReady, registerGracefulShutdown, startHeapMonitor, trackOpenSockets } from '@/server/lifecycle';

const nextUpgradeSink = new Server();

const nextOptions = {
    dev: isDev,
    hostname: nextHostname,
    port,
    turbopack: isDev,
    conf: resolveStandaloneConf(),
    httpServer: nextUpgradeSink,
};

const app = next(nextOptions as Parameters<typeof next>[0]);

const handle = app.getRequestHandler();

function resolveNextUpgradeHandler(): NextUpgradeHandler {
    const routerUpgradeHandler = (app as unknown as { upgradeHandler?: NextUpgradeHandler }).upgradeHandler;

    if (typeof routerUpgradeHandler !== 'function') {
        throw new Error('Next.js did not expose its router upgrade handler');
    }

    return routerUpgradeHandler;
}

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

    setNextUpgradeHandler(resolveNextUpgradeHandler());
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
