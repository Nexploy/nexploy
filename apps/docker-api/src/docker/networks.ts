import { docker } from '../utils/dockerClient'
import { handleAsync } from '../helpers/handleAsync'
import { safeAction } from '../helpers/safeAction'
import { Hono } from 'hono';

const app = new Hono()

/**
 * @openapi
 * /networks:
 *   get:
 *     summary: List networks
 *     responses:
 *       200:
 *         description: Array of networks
 */
app.get('/', handleAsync(async () => docker.listNetworks()))

/**
 * @openapi
 * /networks/create:
 *   post:
 *     summary: Create a network
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Network created
 */
app.post('/create', handleAsync(async (c) => {
    const body = await c.req.json()
    return docker.createNetwork(body)
}))

/**
 * @openapi
 * /networks/{id}:
 *   delete:
 *     summary: Remove a network
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Network removed
 */
app.delete('/:id', safeAction(async (c) => {
    const network = docker.getNetwork(c.req.param('id'))
    await network.remove()
}))

export default app
