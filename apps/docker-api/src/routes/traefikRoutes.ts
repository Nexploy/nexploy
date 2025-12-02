import { Hono } from 'hono';
import { traefikLogsManager } from '@/managers/traefikLogsManager';
import { handleAsync } from '@/helpers/handleAsync';

const app = new Hono();

app.get(
    '/requests',
    handleAsync(async () => {
        return traefikLogsManager.getRequests();
    }),
);

app.delete(
    '/requests',
    handleAsync(async () => {
        traefikLogsManager.clearRequests();
        return { success: true };
    }),
);

export default app;
