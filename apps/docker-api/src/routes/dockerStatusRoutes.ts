import { Hono } from 'hono';
import { dockerStatusManager } from '@/managers/dockerStatusManager';
import { containerStateManager } from '@/managers/containerStateManager';
import { imageStateManager } from '@/managers/imageStateManager';

const app = new Hono();

app.get('/status', (c) => {
    const status = dockerStatusManager.getStatus();
    const lastCheck = dockerStatusManager.getLastCheck();

    return c.json({
        status,
        isConnected: dockerStatusManager.isConnected(),
        isDisconnected: dockerStatusManager.isDisconnected(),
        lastCheck,
        timestamp: Date.now(),
    });
});

app.get('/stats', (c) => {
    const dockerStats = dockerStatusManager.getStats();
    const containerStats = containerStateManager.getStats();
    const imageStats = imageStateManager.getStats();

    return c.json({
        docker: dockerStats,
        containers: containerStats,
        images: imageStats,
        timestamp: Date.now(),
    });
});

export default app;
