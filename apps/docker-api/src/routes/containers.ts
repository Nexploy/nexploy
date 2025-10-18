import { docker } from '../utils/dockerClient'
import { handleAsync } from '../helpers/handleAsync'
import { parseQuery } from '../helpers/parseQuery'
import { Hono } from 'hono';

const app = new Hono()

/**
 * Helper to get container state with error handling
 */
async function getContainerState(containerId: string) {
    try {
        const container = docker.getContainer(containerId)
        const info = await container.inspect()
        return info.State
    } catch (error: any) {
        if (error.statusCode === 404) {
            const err = new Error(`Container '${containerId}' not found`)
            ;(err as any).status = 404
            throw err
        }
        throw error
    }
}

/**
 * Helper to check if container exists
 */
async function containerExists(containerId: string): Promise<boolean> {
    try {
        await getContainerState(containerId)
        return true
    } catch (error: any) {
        if (error.status === 404) return false
        throw error
    }
}

/**
 * @openapi
 * /containers:
 *   get:
 *     summary: List containers
 *     description: Returns Docker containers (running or stopped)
 *     parameters:
 *       - in: query
 *         name: all
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include stopped containers
 *       - in: query
 *         name: filters
 *         schema:
 *           type: string
 *           description: JSON string of filters
 *     responses:
 *       200:
 *         description: Array of containers
 */
app.get('/', handleAsync(async (c) => {
    const all = c.req.query('all') ? JSON.parse(c.req.query('all')!) : true
    const filters = c.req.query('filters') ? JSON.parse(c.req.query('filters')!) : undefined
    return docker.listContainers({ all, filters })
}))

/**
 * @openapi
 * /containers/create:
 *   post:
 *     summary: Create a container
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Docker container create options
 *     responses:
 *       201:
 *         description: Container created
 */
app.post('/create', handleAsync(async (c) => {
    const body = await c.req.json()

    if (!body.Image) {
        const err = new Error('Image is required to create a container')
        ;(err as any).status = 400
        throw err
    }

    try {
        const container = await docker.createContainer(body)
        return container.inspect()
    } catch (error: any) {
        if (error.statusCode === 404) {
            const err = new Error(`Image '${body.Image}' not found`)
            ;(err as any).status = 404
            throw err
        }
        throw error
    }
}, { status: 201 }))

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
app.post('/:id/start', handleAsync(async (c) => {
    const id = c.req.param('id');
    const container = docker.getContainer(id);

    // Verify container exists and get initial state
    const state = await getContainerState(id);

    // Check if already running
    if (state.Running && !state.Paused) {
        const err = new Error('Container is already running');
        (err as any).status = 400;
        throw err;
    }

    // Unpause if needed
    if (state.Paused) {
        try {
            await container.unpause();
        } catch (error: any) {
            const err = new Error(`Failed to unpause container: ${error.message}`);
            (err as any).status = 500;
            throw err;
        }
    }

    // Start the container if not running
    if (!state.Running) {
        try {
            await container.start();
        } catch (error: any) {
            // Handle "already started" case gracefully
            if (error.statusCode === 304) {
                const currentState = await getContainerState(id);
                return {
                    message: 'Container was already started',
                    state: currentState
                };
            }
            const err = new Error(`Failed to start container: ${error.message}`);
            (err as any).status = 500;
            throw err;
        }
    }

    // Wait for container to be fully started
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify the container is actually running
    const newState = await getContainerState(id);

    if (!newState.Running) {
        const exitCode = newState.ExitCode || 'unknown';
        const err = new Error(
            `Container failed to start. Exit code: ${exitCode}. ` +
            `Check logs for more details.`
        );
        (err as any).status = 500;
        throw err;
    }

    return {
        message: 'Container started successfully',
        state: newState
    };
}));

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
app.post('/:id/stop', handleAsync(async (c) => {
    const id = c.req.param('id');
    const container = docker.getContainer(id);

    // Check if container exists and is running
    const state = await getContainerState(id);

    if (!state.Running) {
        const err = new Error('Container is already stopped');
        (err as any).status = 304;
        throw err;
    }

    const timeout = c.req.query('timeout') ? parseInt(c.req.query('timeout')!) : 10;

    try {
        await container.stop({ t: timeout });
        return { message: 'Container stopped successfully' };
    } catch (error: any) {
        if (error.statusCode === 304) {
            return { message: 'Container was already stopped' };
        }
        throw error;
    }
}))

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
app.post('/:id/pause', handleAsync(async (c) => {
    const id = c.req.param('id');
    const container = docker.getContainer(id);

    const state = await getContainerState(id);

    if (!state.Running) {
        const err = new Error('Cannot pause a container that is not running');
        (err as any).status = 400;
        throw err;
    }

    if (state.Paused) {
        const err = new Error('Container is already paused');
        (err as any).status = 400;
        throw err;
    }

    await container.pause();
    return { message: 'Container paused successfully' };
}))

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
app.post('/:id/unpause', handleAsync(async (c) => {
    const id = c.req.param('id');
    const container = docker.getContainer(id);

    const state = await getContainerState(id);

    if (!state.Paused) {
        const err = new Error('Container is not paused');
        (err as any).status = 400;
        throw err;
    }

    await container.unpause();
    return { message: 'Container unpaused successfully' };
}))

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
app.post('/:id/restart', handleAsync(async (c) => {
    const id = c.req.param('id');
    const container = docker.getContainer(id);

    const state = await getContainerState(id);

    // Unpause if needed before restart
    if (state.Paused) {
        await container.unpause();
    }

    const timeout = c.req.query('timeout') ? parseInt(c.req.query('timeout')!) : 10;

    await container.restart({ t: timeout });

    // Wait a bit and verify restart
    await new Promise(resolve => setTimeout(resolve, 1000));
    const newState = await getContainerState(id);

    return {
        message: 'Container restarted successfully',
        state: newState
    };
}))

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
app.get('/:id/info', handleAsync(async (c) => {
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
}))

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
app.delete('/:id', handleAsync(async (c) => {
    const id = c.req.param('id');
    const container = docker.getContainer(id);

    // Check if container exists
    const state = await getContainerState(id);

    const force = parseQuery(c.req.query('force'));
    const removeVolumes = parseQuery(c.req.query('v'));

    // Prevent accidental deletion of running containers
    if (state.Running && !force) {
        const err = new Error(
            'Cannot remove running container. Stop it first or use force=true'
        );
        (err as any).status = 400;
        throw err;
    }

    try {
        await container.remove({ force, v: removeVolumes });
        return {
            message: 'Container removed successfully',
            id
        };
    } catch (error: any) {
        if (error.statusCode === 409) {
            const err = new Error(
                'Container is running. Stop it first or use force=true'
            );
            (err as any).status = 409;
            throw err;
        }
        throw error;
    }
}))

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
app.get('/:id/logs', handleAsync(async (c) => {
    const id = c.req.param('id');

    // Verify container exists
    await containerExists(id);

    const container = docker.getContainer(id);
    const tail = c.req.query('tail') ? parseInt(c.req.query('tail')!) : 100;

    try {
        const logs = await container.logs({
            stdout: true,
            stderr: true,
            tail
        });

        return {
            logs: logs.toString('utf-8'),
            tail
        };
    } catch (error: any) {
        if (error.statusCode === 404) {
            const err = new Error(`Container '${id}' not found`);
            (err as any).status = 404;
            throw err;
        }
        throw error;
    }
}))

export default app
