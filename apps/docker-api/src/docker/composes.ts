import Docker from 'dockerode'
import { Hono } from 'hono'
import { handleAsync } from '../helpers/handleAsync'
import { logger } from '../utils/logger';
import { DockerAction } from '@workspace/typescript-interface/docker';

const docker = new Docker()
const app = new Hono()

/**
 * Contrôle les conteneurs d'une stack Docker Compose.
 */
async function controlComposeStack(projectName: string, action: DockerAction) {
    const containers = await docker.listContainers({ all: true })
    const composeContainers = containers.filter(
        (c) => c.Labels['com.docker.compose.project'] === projectName
    )

    const actions = composeContainers.map(async (containerInfo) => {
        const container = docker.getContainer(containerInfo.Id)

        try {
            if (action === 'start') await container.start()
            if (action === 'stop') await container.stop()
            if (action === 'pause') await container.pause()
            if (action === 'restart') await container.restart()
        } catch (error: any) {
            if (error?.message?.includes('already')) {
                logger.debug(`Container ${containerInfo.Names[0]}: ${error.message}`)
            } else {
                throw error
            }
        }

        return {
            id: containerInfo.Id,
            name: containerInfo.Names[0],
            state: containerInfo.State,
            status: containerInfo.Status,
        }
    })

    return await Promise.all(actions)
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
 * /compose/{project}/pause:
 *   post:
 *     summary: Pause une stack Docker Compose
 *     parameters:
 *       - in: path
 *         name: project
 *         required: true
 *         schema:
 *           type: string
 */
app.post('/:project/pause', handleAsync(async (c) => {
    const project = c.req.param('project')
    return controlComposeStack(project, 'pause')
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
