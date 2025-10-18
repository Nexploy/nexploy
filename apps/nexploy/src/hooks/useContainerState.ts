import { useCallback, useEffect, useState } from 'react'
import { Container } from '@workspace/typescript-interface/docker';


interface ContainerEvent {
    type: 'initial' | 'added' | 'updated' | 'removed'
    container?: Container
    containers?: Container[]
    containerId?: string
    changes?: any
    timestamp: number
}

export function useContainerState(apiUrl: string, containerIds?: string[]) {
    const [containers, setContainers] = useState<Map<string, Container>>(new Map())
    const [isConnected, setIsConnected] = useState(false)
    const [error, setError] = useState<Error | null>(null)
    const [lastUpdate, setLastUpdate] = useState<number>(0)

    useEffect(() => {
        let eventSource: EventSource | null = null
        let reconnectTimeout: NodeJS.Timeout | null = null
        let isActive = true

        const connect = () => {
            if (!isActive) return

            try {
                const url = new URL(`${apiUrl}/api/containers/events/stream`)
                if (containerIds && containerIds.length > 0) {
                    url.searchParams.set('containers', containerIds.join(','))
                }

                eventSource = new EventSource(url.toString())

                eventSource.addEventListener('open', () => {
                    console.log('SSE connection established')
                    setIsConnected(true)
                    setError(null)
                })

                eventSource.addEventListener('initial-state', (e) => {
                    const data: ContainerEvent = JSON.parse(e.data)
                    const newMap = new Map<string, Container>()

                    data.containers?.forEach(container => {
                        newMap.set(container.id, container)
                    })

                    setContainers(newMap)
                    setLastUpdate(data.timestamp)
                    console.log('Initial state received:', newMap.size, 'containers')
                })

                eventSource.addEventListener('state-change', (e) => {
                    const data: ContainerEvent = JSON.parse(e.data)

                    setContainers(prev => {
                        const next = new Map(prev)

                        if (data.type === 'removed' && data.containerId) {
                            next.delete(data.containerId)
                        } else if (data.container) {
                            next.set(data.container.id, data.container)
                        }

                        return next
                    })

                    setLastUpdate(data.timestamp)
                    console.log('State change:', data.type, data.container?.name || data.containerId)
                })

                eventSource.addEventListener('container-added', (e) => {
                    const data: ContainerEvent = JSON.parse(e.data)

                    if (data.container) {
                        setContainers(prev => {
                            const next = new Map(prev)
                            next.set(data.container!.id, data.container!)
                            return next
                        })
                        setLastUpdate(data.timestamp)
                        console.log('Container added:', data.container.name)
                    }
                })

                eventSource.addEventListener('container-removed', (e) => {
                    const data: ContainerEvent = JSON.parse(e.data)

                    if (data.containerId) {
                        setContainers(prev => {
                            const next = new Map(prev)
                            next.delete(data.containerId!)
                            return next
                        })
                        setLastUpdate(data.timestamp)
                        console.log('Container removed:', data.containerId)
                    }
                })

                eventSource.addEventListener('heartbeat', () => {
                    // Connection is alive
                    console.log('Heartbeat received')
                })

                eventSource.addEventListener('error', (e) => {
                    console.error('SSE error:', e)
                    setIsConnected(false)

                    if (eventSource) {
                        eventSource.close()
                        eventSource = null
                    }

                    // Reconnect after 5 seconds
                    if (isActive) {
                        setError(new Error('Connection lost, reconnecting...'))
                        reconnectTimeout = setTimeout(() => {
                            if (isActive) {
                                console.log('Attempting to reconnect...')
                                connect()
                            }
                        }, 5000)
                    }
                })
            } catch (err) {
                console.error('Failed to connect:', err)
                setError(err as Error)
                setIsConnected(false)
            }
        }

        connect()

        // Cleanup
        return () => {
            isActive = false

            if (reconnectTimeout) {
                clearTimeout(reconnectTimeout)
            }

            if (eventSource) {
                eventSource.close()
            }
        }
    }, [apiUrl, containerIds?.join(',')])

    const getContainer = useCallback((id: string) => {
        return containers.get(id)
    }, [containers])

    const getContainersByState = useCallback((state: ContainerState['state']) => {
        return Array.from(containers.values()).filter(c => c.state === state)
    }, [containers])

    return {
        containers: Array.from(containers.values()),
        containersMap: containers,
        isConnected,
        error,
        lastUpdate,
        getContainer,
        getContainersByState
    }
}
