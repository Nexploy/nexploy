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
        const abortController = new AbortController();
        let isClientDisconnected = false;

        c.req.raw.signal.addEventListener('abort', () => {
            isClientDisconnected = true;
            abortController.abort();
        });

        try {
            const onLog = (log: string) => {
                if (isClientDisconnected || c.req.raw.signal.aborted) {
                    return;
                }

                try {
                    stream.writeSSE({
                        data: JSON.stringify({
                            type: 'log',
                            message: log,
                            timestamp: new Date().toISOString(),
                        }),
                        event: 'build-log',
                    });
                } catch (e) {}
            };

            const result = await imagesStateManager.buildImage(
                workDir,
                imageName,
                onLog,
                abortController.signal,
            );

            if (!isClientDisconnected && !c.req.raw.signal.aborted) {
                await stream.writeSSE({
                    data: JSON.stringify({
                        type: 'complete',
                        result,
                    }),
                    event: 'build-complete',
                });
            }

            await stream.close();
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                await stream.close();
                return;
            }

            if (!isClientDisconnected && !c.req.raw.signal.aborted) {
                try {
                    await stream.writeSSE({
                        data: JSON.stringify({
                            type: 'error',
                            message: error instanceof Error ? error.message : 'Unknown error',
                        }),
                        event: 'build-error',
                    });
                } catch (e) {}
            }

            await stream.close();
        }
    });
});

export default app;
