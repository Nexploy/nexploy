import { handleAsync } from '@/helpers/handleAsync';
import { Hono } from 'hono';
import { eventsStateManager } from '@/managers/eventsStateManager';

const app = new Hono();

app.post(
    '/hardRefresh',
    handleAsync(async () => {
        return await eventsStateManager.hardRefresh();
    }),
);

export default app;
