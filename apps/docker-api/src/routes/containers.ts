import { docker } from '@/utils/dockerClient';
import { handleAsync } from '@/helpers/handleAsync';
import { Hono } from 'hono';

const app = new Hono();

/**
 * @openapi
 * /containers/{id}/start:
 *   post:
 *     summary: Start container
 *     description: Starts a stopped container or unpauses a paused container
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Container started or unpaused
 *       400:
 *         description: Container already running
 *       404:
 *         description: Container not found
 */
app.post(
    '/:id/start',
    handleAsync(async (c) => {
        const id = c.req.param('id');
        const container = docker.getContainer(id);

        await container.start();
    }),
);

/**
 * @openapi
 * /containers/{id}/stop:
 *   post:
 *     summary: Stop container
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: timeout
 *         schema:
 *           type: integer
 *         description: Seconds to wait before killing
 *     responses:
 *       200:
 *         description: Container stopped
 *       304:
 *         description: Container already stopped
 *       404:
 *         description: Container not found
 */
app.post(
    '/:id/stop',
    handleAsync(async (c) => {
        const id = c.req.param('id');
        const container = docker.getContainer(id);

        await container.stop();
    }),
);

/**
 * @openapi
 * /containers/{id}/pause:
 *   post:
 *     summary: Pause container
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Container paused
 *       400:
 *         description: Container not running or already paused
 *       404:
 *         description: Container not found
 */
app.post(
    '/:id/pause',
    handleAsync(async (c) => {
        const id = c.req.param('id');
        const container = docker.getContainer(id);

        await container.pause();
    }),
);

/**
 * @openapi
 * /containers/{id}/unpause:
 *   post:
 *     summary: Unpause container
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Container unpaused
 *       400:
 *         description: Container not paused
 *       404:
 *         description: Container not found
 */
app.post(
    '/:id/unpause',
    handleAsync(async (c) => {
        const id = c.req.param('id');
        const container = docker.getContainer(id);

        await container.unpause();
    }),
);

/**
 * @openapi
 * /containers/{id}/restart:
 *   post:
 *     summary: Restart container
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: timeout
 *         schema:
 *           type: integer
 *         description: Seconds to wait before killing
 *     responses:
 *       200:
 *         description: Container restarted
 *       404:
 *         description: Container not found
 */
app.post(
    '/:id/restart',
    handleAsync(async (c) => {
        const id = c.req.param('id');
        const container = docker.getContainer(id);

        await container.restart();
    }),
);

/**
 * @openapi
 * /containers/{id}/info:
 *   get:
 *     summary: Get container information
 *     description: Returns detailed information about a specific container
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Container ID or name
 *     responses:
 *       200:
 *         description: Container information
 *       404:
 *         description: Container not found
 */
app.get(
    '/:id/info',
    handleAsync(async (c) => {
        const id = c.req.param('id');
        const container = docker.getContainer(id);

        try {
            return await container.inspect();
        } catch (error: any) {
            if (error.statusCode === 404) {
                const err = new Error(`Container '${id}' not found`);
                (err as any).status = 404;
                throw err;
            }
            throw error;
        }
    }),
);

/**
 * @openapi
 * /containers/{id}:
 *   delete:
 *     summary: Remove container
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: force
 *         schema:
 *           type: boolean
 *         description: Force remove even if running
 *       - in: query
 *         name: v
 *         schema:
 *           type: boolean
 *         description: Remove associated volumes
 *     responses:
 *       200:
 *         description: Container removed
 *       400:
 *         description: Container is running (use force=true)
 *       404:
 *         description: Container not found
 */
app.delete(
    '/:id',
    handleAsync(async (c) => {
        const id = c.req.param('id');
        const container = docker.getContainer(id);

        container.remove();
    }),
);

/**
 * @openapi
 * /containers/{id}/logs:
 *   get:
 *     summary: Get container logs
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: tail
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Number of lines to show from end
 *       - in: query
 *         name: follow
 *         schema:
 *           type: boolean
 *         description: Follow log output
 *     responses:
 *       200:
 *         description: Logs of the container
 *       404:
 *         description: Container not found
 */
app.get(
    '/:id/logs',
    handleAsync(async (c) => {
        const id = c.req.param('id');

        const container = docker.getContainer(id);
        const tail = c.req.query('tail') ? parseInt(c.req.query('tail')!) : 100;

        const logs = await container.logs({
            stdout: true,
            stderr: true,
            tail,
        });

        return {
            logs: logs.toString('utf-8'),
            tail,
        };
    }),
);

export default app;
