import { handleAsync } from '@/helpers/handleAsync';
import { Hono } from 'hono';
import { containersStateManager } from '@/managers/containersStateManager';

const app = new Hono();

app.post(
    '/hardRefresh',
    handleAsync(async () => {
        return await containersStateManager.hardRefresh();
    }),
);

export default app;
