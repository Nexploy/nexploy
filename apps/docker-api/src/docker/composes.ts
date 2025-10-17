import Docker from 'dockerode'
import { Hono } from 'hono'
import { handleAsync } from '../helpers/handleAsync.js'

const docker = new Docker()
const app = new Hono()

/**
 * Contrôle les conteneurs d'une stack Docker Compose.
 */
async function controlComposeStack(projectName: string, action: 'start' | 'stop' | 'restart') {
    const containers = await docker.listContainers({ all: true })
    const composeContainers = containers.filter(
        (c) => c.Labels['com.docker.compose.project'] === projectName
    )

    for (const containerInfo of composeContainers) {
        const container = docker.getContainer(containerInfo.Id)
        if (action === 'start') await container.start()
        if (action === 'stop') await container.stop()
        if (action === 'restart') await container.restart()
    }

    return composeContainers.map((c) => ({
        id: c.Id,
        name: c.Names[0],
        state: c.State,
        status: c.Status,
    }))
}

/**
 * @openapi
 * /compose:
 *   get:
 *     summary: Liste les stacks Docker Compose
 *     responses:
 *       200:
 *         description: Liste des projets Docker Compose détectés
 */
app.get('/', handleAsync(async (c) => {
    const containers = await docker.listContainers({ all: true })
    const projects = Array.from(
        new Set(containers.map((c) => c.Labels['com.docker.compose.project']).filter(Boolean))
    )
    return { projects }
}))

/**
 * @openapi
 * /compose/{project}/start:
 *   post:
 *     summary: Démarre une stack Docker Compose
 *     parameters:
 *       - in: path
 *         name: project
 *         required: true
 *         schema:
 *           type: string
 */
app.post('/:project/start', handleAsync(async (c) => {
    const project = c.req.param('project')
    return controlComposeStack(project, 'start')
}))

/**
 * @openapi
 * /compose/{project}/stop:
 *   post:
 *     summary: Stoppe une stack Docker Compose
 *     parameters:
 *       - in: path
 *         name: project
 *         required: true
 *         schema:
 *           type: string
 */
app.post('/:project/stop', handleAsync(async (c) => {
    const project = c.req.param('project')
    return controlComposeStack(project, 'stop')
}))

/**
 * @openapi
 * /compose/{project}/restart:
 *   post:
 *     summary: Redémarre une stack Docker Compose
 *     parameters:
 *       - in: path
 *         name: project
 *         required: true
 *         schema:
 *           type: string
 */
app.post('/:project/restart', handleAsync(async (c) => {
    const project = c.req.param('project')
    return controlComposeStack(project, 'restart')
}))

/**
 * @openapi
 * /compose/{project}:
 *   get:
 *     summary: Liste les conteneurs d'une stack Docker Compose
 *     parameters:
 *       - in: path
 *         name: project
 *         required: true
 *         schema:
 *           type: string
 */
app.get('/:project', handleAsync(async (c) => {
    const project = c.req.param('project')
    const containers = await docker.listContainers({ all: true })
    const composeContainers = containers.filter(
        (c) => c.Labels['com.docker.compose.project'] === project
    )
    return composeContainers.map((c) => ({
        id: c.Id,
        name: c.Names[0],
        image: c.Image,
        state: c.State,
        status: c.Status,
    }))
}))

export default app
