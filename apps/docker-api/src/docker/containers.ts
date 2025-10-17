import { docker } from '../utils/dockerClient.js'
import { handleAsync } from '../helpers/handleAsync.js'
import { safeAction } from '../helpers/safeAction.js'
import { parseQuery } from '../helpers/parseQuery.js'
import { Hono } from 'hono';

const app = new Hono()

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
    const container = await docker.createContainer(body)
    return container.inspect()
}, { status: 201 }))

/**
 * @openapi
 * /containers/{id}/start:
 *   post:
 *     summary: Start container
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Container started
 */
app.post('/:id/start', safeAction(async (c) => {
    const container = docker.getContainer(c.req.param('id')) 
    await container.start()
}))

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
 *     responses:
 *       200:
 *         description: Container stopped
 */
app.post('/:id/stop', safeAction(async (c) => {
    const container = docker.getContainer(c.req.param('id'))
    await container.stop()
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
 *     responses:
 *       200:
 *         description: Container restarted
 */
app.post('/:id/restart', safeAction(async (c) => {
    const container = docker.getContainer(c.req.param('id'))
    await container.restart()
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
 *     responses:
 *       200:
 *         description: Container removed
 */
app.delete('/:id', safeAction(async (c) => {
    const container = docker.getContainer(c.req.param('id'))
    const force = parseQuery(c.req.query('force'))
    await container.remove({ force })
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
 *     responses:
 *       200:
 *         description: Logs of the container
 */
app.get('/:id/logs', handleAsync(async (c) => {
    const container = docker.getContainer(c.req.param('id'))
    const logs = await container.logs({ stdout: true, stderr: true, tail: 100 })
    return { logs: logs.toString('utf-8') }
}))

export default app
