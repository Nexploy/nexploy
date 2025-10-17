import { docker } from '../utils/dockerClient'
import { handleAsync } from '../helpers/handleAsync'
import { Hono } from 'hono';

const app = new Hono()

/**
 * @openapi
 * /_health:
 *   get:
 *     summary: Health check
 *     description: Pings Docker daemon.
 *     responses:
 *       200:
 *         description: Docker is healthy
 */
app.get('/_health', handleAsync(async () => {
    await docker.ping()
    return { healthy: true }
}))

/**
 * @openapi
 * /version:
 *   get:
 *     summary: Docker version
 *     responses:
 *       200:
 *         description: Returns Docker version info
 */
app.get('/version', handleAsync(async () => docker.version()))

/**
 * @openapi
 * /info:
 *   get:
 *     summary: Docker info
 *     responses:
 *       200:
 *         description: Returns Docker system info
 */
app.get('/info', handleAsync(async () => docker.info()))

export default app
