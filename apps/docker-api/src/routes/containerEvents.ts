// routes/containerEvents.ts
import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { containerStateManager } from '../services/containerStateManager'
import { logger } from '../utils/logger'

const app = new Hono()

/**
 * @openapi
 * /containers/events/stream:
 *   get:
 *     summary: Stream container state changes (SSE)
 *     description: Server-Sent Events endpoint for real-time container state updates
 *     parameters:
 *       - in: query
 *         name: containers
 *         schema:
 *           type: string
 *         description: Comma-separated list of container IDs to watch (optional)
 *     responses:
 *       200:
 *         description: SSE stream
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: object
 */
app.get('/stream', (c) => {
    const watchContainers = c.req.query('containers')?.split(',').filter(Boolean)

    return streamSSE(c, async (stream) => {
        let isActive = true
        const clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        logger.info({ clientId, watchContainers }, 'SSE client connected')

        // Send initial state
        const initialState = containerStateManager.getAllStates()
        const filteredInitial = watchContainers
            ? initialState.filter(s => watchContainers.includes(s.id))
            : initialState

        await stream.writeSSE({
            data: JSON.stringify({
                type: 'initial',
                containers: filteredInitial,
                timestamp: Date.now()
            }),
            event: 'initial-state',
            id: `${Date.now()}`
        })

        // Send heartbeat every 15 seconds
        const heartbeatInterval = setInterval(async () => {
            if (!isActive) return
            try {
                await stream.writeSSE({
                    data: JSON.stringify({ type: 'heartbeat', timestamp: Date.now() }),
                    event: 'heartbeat'
                })
            } catch (err) {
                logger.error({ err, clientId }, 'Error sending heartbeat')
                cleanup()
            }
        }, 15000)

        // State change handler
        const handleStateChange = async (event: any) => {
            if (!isActive) return

            // Filter by watched containers if specified
            if (watchContainers && !watchContainers.includes(event.container.id)) {
                return
            }

            try {
                await stream.writeSSE({
                    data: JSON.stringify({
                        type: event.type,
                        container: event.container,
                        changes: event.changes,
                        timestamp: Date.now()
                    }),
                    event: 'state-change',
                    id: `${Date.now()}`
                })
            } catch (err) {
                logger.error({ err, clientId }, 'Error sending state change')
                cleanup()
            }
        }

        // Container added handler
        const handleContainerAdded = async (container: any) => {
            if (!isActive) return
            if (watchContainers && !watchContainers.includes(container.id)) return

            try {
                await stream.writeSSE({
                    data: JSON.stringify({
                        type: 'added',
                        container,
                        timestamp: Date.now()
                    }),
                    event: 'container-added',
                    id: `${Date.now()}`
                })
            } catch (err) {
                logger.error({ err, clientId }, 'Error sending container-added')
                cleanup()
            }
        }

        // Container removed handler
        const handleContainerRemoved = async (event: any) => {
            if (!isActive) return
            if (watchContainers && !watchContainers.includes(event.id)) return

            try {
                await stream.writeSSE({
                    data: JSON.stringify({
                        type: 'removed',
                        containerId: event.id,
                        oldState: event.oldState,
                        timestamp: Date.now()
                    }),
                    event: 'container-removed',
                    id: `${Date.now()}`
                })
            } catch (err) {
                logger.error({ err, clientId }, 'Error sending container-removed')
                cleanup()
            }
        }

        // Cleanup function
        const cleanup = () => {
            if (!isActive) return
            isActive = false

            clearInterval(heartbeatInterval)
            containerStateManager.off('state-change', handleStateChange)
            containerStateManager.off('container-added', handleContainerAdded)
            containerStateManager.off('container-removed', handleContainerRemoved)

            logger.info({ clientId }, 'SSE client disconnected')
        }

        // Register event listeners
        containerStateManager.on('state-change', handleStateChange)
        containerStateManager.on('container-added', handleContainerAdded)
        containerStateManager.on('container-removed', handleContainerRemoved)

        // Handle client disconnect
        c.req.raw.signal.addEventListener('abort', cleanup)
        // Keep stream alive
        await stream.sleep(2_147_483_647)
    })
})

/**
 * @openapi
 * /containers/events/current:
 *   get:
 *     summary: Get current state of all containers
 *     responses:
 *       200:
 *         description: Current container states
 */
app.get('/current', (c) => {
    const states = containerStateManager.getAllStates()
    return c.json({
        containers: states,
        count: states.length,
        timestamp: Date.now()
    })
})

/**
 * @openapi
 * /containers/events/container/{id}:
 *   get:
 *     summary: Get current state of specific container
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Container state
 *       404:
 *         description: Container not found
 */
app.get('/container/:id', (c) => {
    const id = c.req.param('id')
    const state = containerStateManager.getState(id)

    if (!state) {
        return c.json({ error: 'Container not found' }, 404)
    }

    return c.json(state)
})

export default app
