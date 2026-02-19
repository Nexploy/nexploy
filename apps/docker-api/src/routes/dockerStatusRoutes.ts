import { Hono } from 'hono';
import { dockerStatusManager } from '@/managers/dockerStatusManager';
import { containersStateManager } from '@/managers/containersStateManager';
import { imagesStateManager } from '@/managers/imagesStateManager';
import { handleAsync } from '@/helpers/handleAsync';

const app = new Hono();

app.get(
    '/status',
    handleAsync(async () => {
        const status = dockerStatusManager.getStatus();
        const lastCheck = dockerStatusManager.getLastCheck();

        return {
            status,
            isConnected: dockerStatusManager.isConnected(),
            isDisconnected: dockerStatusManager.isDisconnected(),
            lastCheck,
            timestamp: Date.now(),
        };
    }),
);

app.get(
    '/stats',
    handleAsync(async () => {
        const dockerStats = dockerStatusManager.getStats();
        const containerStats = containersStateManager.getStats();
        const imageStats = imagesStateManager.getStats();

        return {
            docker: dockerStats,
            containers: containerStats,
            images: imageStats,
            timestamp: Date.now(),
        };
    }),
);

export default app;
