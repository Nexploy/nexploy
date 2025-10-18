import { docker } from '../utils/dockerClient'
import { EventEmitter } from 'events'
import { logger } from '../utils/logger'
import { ContainerInfo, ContainerInspectInfo } from 'dockerode';
import byline from 'byline'
import { Container } from '@workspace/typescript-interface/docker';


class ContainerStateManager extends EventEmitter {
    private containers: Map<string, Container> = new Map()
    private polling: boolean = false
    private pollInterval: NodeJS.Timeout | null = null
    private readonly POLL_INTERVAL_MS = 10000
    private dockerEventStream: any = null
    private reconnectAttempts = 0
    private readonly MAX_RECONNECT_ATTEMPTS = 5

    constructor() {
        super()
        this.setMaxListeners(100) // Support multiple clients
    }

    /**
     * Start monitoring containers using Docker events API
     */
    async start() {
        if (this.polling) {
            logger.warn('Container state manager already running')
            return
        }

        this.polling = true
        // Initial state load
        await this.loadInitialState()

        // Start Docker events listener
        await this.startDockerEventsListener()

        // Fallback polling for reliability
        this.startFallbackPolling()
    }

    /**
     * Stop monitoring
     */
    async stop() {
        this.polling = false
        logger.info('Stopping container state manager')

        if (this.pollInterval) {
            clearInterval(this.pollInterval)
            this.pollInterval = null
        }

        if (this.dockerEventStream) {
            try {
                this.dockerEventStream.destroy()
            } catch (err) {
                logger.error({ err }, 'Error destroying Docker event stream')
            }
            this.dockerEventStream = null
        }

        this.containers.clear()
        this.removeAllListeners()
    }

    /**
     * Load initial state of all containers
     */
    private async loadInitialState() {
        try {
            const containers = await docker.listContainers({ all: true })

            for (const container of containers) {
                const state = this.parseContainerInfo(container)
                this.containers.set(state.id, state)
            }

            logger.info({ count: this.containers.size }, 'Initial container state loaded')
            this.emit('initial-state', Array.from(this.containers.values()))
        } catch (err) {
            logger.error({ err }, 'Error loading initial container state')
            throw err
        }
    }

    /**
     * Listen to Docker events in real-time
     */
    private async startDockerEventsListener() {
        try {
            const stream = await docker.getEvents({
                filters: { type: ['container'] }
            })

            this.dockerEventStream = stream
            this.reconnectAttempts = 0

            const lineStream = byline.createStream(stream)

            lineStream.on('data', async (line: Buffer) => {
                const str = line.toString().trim()
                if (!str) return

                try {
                    const event = JSON.parse(str)
                    await this.handleDockerEvent(event)
                } catch (err) {
                    logger.error({ err, raw: str }, 'Error parsing Docker event')
                }
            })

            lineStream.on('error', (err: Error) => {
                logger.error({ err }, 'Docker events stream error')
                this.handleStreamError()
            })

            lineStream.on('end', () => {
                logger.warn('Docker events stream ended')
                this.handleStreamError()
            })

            logger.info('Docker events listener started')
        } catch (err) {
            logger.error({ err }, 'Error starting Docker events listener')
            this.handleStreamError()
        }
    }

    /**
     * Handle Docker event stream errors with exponential backoff
     */
    private async handleStreamError() {
        if (!this.polling) return

        this.dockerEventStream = null
        this.reconnectAttempts++

        if (this.reconnectAttempts > this.MAX_RECONNECT_ATTEMPTS) {
            logger.error('Max reconnection attempts reached, relying on polling only')
            return
        }

        const backoffDelay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)
        logger.info({ backoffDelay, attempt: this.reconnectAttempts }, 'Reconnecting to Docker events')

        setTimeout(() => {
            if (this.polling) {
                this.startDockerEventsListener()
            }
        }, backoffDelay)
    }

    /**
     * Handle individual Docker events
     */
    private async handleDockerEvent(event: any) {
        const containerId = event.Actor?.ID
        if (!containerId) return

        const action = event.Action
        logger.debug({ containerId, action }, 'Docker event received')

        // Events that require state update
        const stateChangeEvents = [
            'start', 'die', 'stop', 'pause', 'unpause',
            'restart', 'kill', 'create', 'destroy', 'health_status'
        ]

        if (stateChangeEvents.includes(action)) {
            await this.updateContainerState(containerId, action)
        }
    }

    /**
     * Update state for a specific container
     */
    private async updateContainerState(containerId: string, action?: string) {
        try {
            // Handle destroy event
            if (action === 'destroy') {
                const oldState = this.containers.get(containerId)
                this.containers.delete(containerId)

                if (oldState) {
                    this.emit('container-removed', { id: containerId, oldState })
                    this.emit('state-change', {
                        type: 'removed',
                        container: oldState
                    })
                }
                return
            }

            // Get fresh state from Docker
            const container = docker.getContainer(containerId)
            const info = await container.inspect()
            const newState = this.parseContainerInspect(info)

            const oldState = this.containers.get(containerId)
            this.containers.set(containerId, newState)

            // Emit events
            if (!oldState) {
                this.emit('container-added', newState)
                this.emit('state-change', {
                    type: 'added',
                    container: newState
                })
            } else if (this.hasStateChanged(oldState, newState)) {
                this.emit('container-updated', { oldState, newState })
                this.emit('state-change', {
                    type: 'updated',
                    container: newState,
                    changes: this.getStateChanges(oldState, newState)
                })
            }
        } catch (err: any) {
            if (err.statusCode === 404) {
                // Container was removed
                const oldState = this.containers.get(containerId)
                this.containers.delete(containerId)

                if (oldState) {
                    this.emit('container-removed', { id: containerId, oldState })
                    this.emit('state-change', {
                        type: 'removed',
                        container: oldState
                    })
                }
            } else {
                logger.error({ err, containerId }, 'Error updating container state')
            }
        }
    }

    /**
     * Fallback polling mechanism
     */
    private startFallbackPolling() {
        this.pollInterval = setInterval(async () => {
            if (!this.polling) return

            try {
                await this.fullStateSync()
            } catch (err) {
                logger.error({ err }, 'Error in fallback polling')
            }
        }, this.POLL_INTERVAL_MS)

        logger.info({ interval: this.POLL_INTERVAL_MS }, 'Fallback polling started')
    }

    /**
     * Full state synchronization (fallback)
     */
    private async fullStateSync() {
        try {
            const containers = await docker.listContainers({ all: true })
            const currentIds = new Set(containers.map(c => c.Id))

            // Update existing and add new containers
            for (const container of containers) {
                const newState = this.parseContainerInfo(container)
                const oldState = this.containers.get(newState.id)

                if (!oldState) {
                    this.containers.set(newState.id, newState)
                    this.emit('container-added', newState)
                    this.emit('state-change', {
                        type: 'added',
                        container: newState
                    })
                } else if (this.hasStateChanged(oldState, newState)) {
                    this.containers.set(newState.id, newState)
                    this.emit('container-updated', { oldState, newState })
                    this.emit('state-change', {
                        type: 'updated',
                        container: newState,
                        changes: this.getStateChanges(oldState, newState)
                    })
                }
            }

            // Remove deleted containers
            for (const [id, state] of this.containers) {
                if (!currentIds.has(id)) {
                    this.containers.delete(id)
                    this.emit('container-removed', { id, oldState: state })
                    this.emit('state-change', {
                        type: 'removed',
                        container: state
                    })
                }
            }
        } catch (err) {
            logger.error({ err }, 'Error in full state sync')
        }
    }

    /**
     * Parse container info from list
     */
    private parseContainerInfo(container: ContainerInfo): Container {
        return {
            id: container.Id,
            name: container.Names?.[0]?.replace(/^\//, '') || 'unknown',
            image: container.Image,
            status: container.Status,
            state: this.normalizeState(container.State),
            timestamp: Date.now()
        }
    }

    /**
     * Parse container info from inspect
     */
    private parseContainerInspect(info: ContainerInspectInfo): Container {
        return {
            id: info.Id,
            name: info.Name?.replace(/^\//, '') || 'unknown',
            image: info.Config?.Image || 'unknown',
            status: info.State?.Status || 'unknown',
            state: this.normalizeState(info.State?.Status),
            health: info.State?.Health?.Status,
            exitCode: info.State?.ExitCode,
            error: info.State?.Error,
            timestamp: Date.now()
        }
    }

    /**
     * Normalize Docker state to our state enum
     */
    private normalizeState(dockerState: string): Container['state'] {
        const state = dockerState?.toLowerCase()
        if (['running', 'paused', 'restarting', 'created', 'dead', 'exited'].includes(state)) {
            return state as Container['state']
        }
        return 'exited'
    }

    /**
     * Check if state has changed
     */
    private hasStateChanged(oldState: Container, newState: Container): boolean {
        return (
            oldState.state !== newState.state ||
            oldState.status !== newState.status ||
            oldState.health !== newState.health ||
            oldState.exitCode !== newState.exitCode
        )
    }

    /**
     * Get detailed state changes
     */
    private getStateChanges(oldState: Container, newState: Container) {
        const changes: any = {}

        if (oldState.state !== newState.state) changes.state = { from: oldState.state, to: newState.state }
        if (oldState.status !== newState.status) changes.status = { from: oldState.status, to: newState.status }
        if (oldState.health !== newState.health) changes.health = { from: oldState.health, to: newState.health }
        if (oldState.exitCode !== newState.exitCode) changes.exitCode = {
            from: oldState.exitCode,
            to: newState.exitCode
        }

        return changes
    }

    /**
     * Get current state of all containers
     */
    getAllStates(): Container[] {
        return Array.from(this.containers.values())
    }

    /**
     * Get state of specific container
     */
    getState(containerId: string): Container | undefined {
        return this.containers.get(containerId)
    }
}

// Singleton instance
export const containerStateManager = new ContainerStateManager()
