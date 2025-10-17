import { docker } from '../utils/dockerClient'
import { handleAsync } from '../helpers/handleAsync'
import { safeAction } from '../helpers/safeAction'
import { parseQuery } from '../helpers/parseQuery'
import { Hono } from 'hono';

const app = new Hono()

/**
 * @openapi
 * /images:
 *   get:
 *     summary: List images
 *     parameters:
 *       - in: query
 *         name: all
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Array of images
 */
app.get('/', handleAsync(async (c) => {
    const all = parseQuery(c.req.query('all'))
    return docker.listImages({ all })
}))

/**
 * @openapi
 * /images/pull:
 *   post:
 *     summary: Pull an image
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *     responses:
 *       200:
 *         description: Image pulled
 */
app.post('/pull', safeAction(async (c) => {
    const { image } = await c.req.json()
    await new Promise((resolve, reject) => {
        docker.pull(image, (err: any, stream: NodeJS.ReadableStream) => {
            if (err) return reject(err)
            docker.modem.followProgress(stream, (err2) => (err2 ? reject(err2) : resolve(undefined)))
        })
    })
}))

/**
 * @openapi
 * /images/{id}/tag:
 *   post:
 *     summary: Tag an image
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               repo:
 *                 type: string
 *               tag:
 *                 type: string
 *     responses:
 *       200:
 *         description: Image tagged
 */
app.post('/:id/tag', safeAction(async (c) => {
    const { repo, tag } = await c.req.json()
    const image = docker.getImage(c.req.param('id'))
    await image.tag({ repo, tag })
}))

/**
 * @openapi
 * /images/{id}:
 *   delete:
 *     summary: Remove an image
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
 *         description: Image removed
 */
app.delete('/:id', safeAction(async (c) => {
    const image = docker.getImage(c.req.param('id'))
    const force = parseQuery(c.req.query('force'))
    await image.remove({ force })
}))

export default app
