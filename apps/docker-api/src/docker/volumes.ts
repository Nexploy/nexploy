import { docker } from '../utils/dockerClient.js'
import { handleAsync } from '../helpers/handleAsync.js'
import { safeAction } from '../helpers/safeAction.js'
import { Hono } from 'hono';

const app = new Hono()

/**
 * @openapi
 * /volumes:
 *   get:
 *     summary: List volumes
 *     responses:
 *       200:
 *         description: Array of volumes
 */
app.get('/', handleAsync(async () => {
    const data = await docker.listVolumes()
    return data.Volumes || []
}))

/**
 * @openapi
 * /volumes/create:
 *   post:
 *     summary: Create a volume
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Volume created
 */
app.post('/create', handleAsync(async (c) => {
    const body = await c.req.json()
    return docker.createVolume(body)
}))

/**
 * @openapi
 * /volumes/{name}:
 *   delete:
 *     summary: Remove a volume
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Volume removed
 */
app.delete('/:name', safeAction(async (c) => {
    const volume = docker.getVolume(c.req.param('name'))
    await volume.remove()
}))

export default app
