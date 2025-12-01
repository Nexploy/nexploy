import { Hono } from 'hono';
import { imagesStateManager } from '@/managers/imagesStateManager';
import { streamSSE } from 'hono/streaming';

const app = new Hono();

app.post('/stream/build', async (c) => {
    const { workDir, imageName } = await c.req.json<{
        workDir: string;
        imageName: string;
    }>();

    return streamSSE(c, async (stream) => {
        try {
            const onLog = (log: string) => {
                stream.writeSSE({
                    data: JSON.stringify({
                        type: 'log',
                        message: log,
                        timestamp: new Date().toISOString(),
                    }),
                    event: 'build-log',
                });
            };

            const result = await imagesStateManager.buildImage(workDir, imageName, onLog);

            await stream.writeSSE({
                data: JSON.stringify({
                    type: 'complete',
                    result,
                }),
                event: 'build-complete',
            });

            await stream.close();
        } catch (error) {
            await stream.writeSSE({
                data: JSON.stringify({
                    type: 'error',
                    message: error instanceof Error ? error.message : 'Unknown error',
                }),
                event: 'build-error',
            });

            await stream.close();
        }
    });
});

export default app;
