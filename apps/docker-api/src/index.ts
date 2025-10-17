import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import info from './docker/info';
import volumes from './docker/volumes';
import networks from './docker/networks';
import images from './docker/images';
import containers from './docker/containers';
import { logger } from './utils/logger';
import composes from './docker/composes';

export const app = new Hono()

app.use('*', cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'OPTIONS', 'DELETE', 'PUT'],
    allowHeaders: ['Content-Type', 'Authorization'],
}))

app.get('/api', (c) => {
    return c.json({ name: 'docker-api' })
})

app.route('/api/containers', containers)
app.route('/api/composes', composes)
app.route('/api/images', images)
app.route('/api/networks', networks)
app.route('/api/volumes', volumes)
app.route('/api', info)

serve({ fetch: app.fetch, port: 3300 }, (info) =>
    logger.info(`Server running on http://localhost:${info.port}`)
)
