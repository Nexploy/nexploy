import { Hono } from 'hono';
import { dockerStatusManager } from '@/services/dockerStatusManager';
import { containerStateManager } from '@/services/containerStateManager';
import { imageStateManager } from '@/services/imageStateManager';

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
