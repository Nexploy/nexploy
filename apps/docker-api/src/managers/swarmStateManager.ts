import { docker } from '@/utils/dockerClient';
import { logger } from '@/utils/logger';
import {
    SwarmInfo,
    SwarmNode,
    SwarmService,
    SwarmEvent,
    SwarmNodeStatus,
    SwarmNodeAvailability,
} from '@workspace/typescript-interface/docker/docker.swarm';
import { dockerStatusManager } from '@/managers/dockerStatusManager';
import { BaseStateManager } from '@/lib/BaseStateManager';
import { Swarm } from 'dockerode';

class SwarmStateManager extends BaseStateManager {
    private nodes: Map<string, SwarmNode> = new Map();
    private services: Map<string, SwarmService> = new Map();
    private swarmInfo: SwarmInfo | null = null;
    private isSwarmActive: boolean = false;

    constructor() {
        super({
            managerName: 'Swarm State Manager',
            pollIntervalMs: 15000,
            maxReconnectAttempts: 5,
            maxListeners: 100,
        });
    }

    async loadInitialState(): Promise<void> {
        if (!dockerStatusManager.isConnected()) {
            logger.warn('Cannot load initial state: Docker is not connected');
            return;
        }

        try {
            const info = await docker.info();

            if (!info.Swarm || info.Swarm.LocalNodeState !== 'active') {
                this.isSwarmActive = false;
                this.swarmInfo = null;
                this.nodes.clear();
                this.services.clear();

                const notInSwarmEvent: SwarmEvent = {
                    type: 'not-in-swarm',
                    timestamp: Date.now(),
                };
                this.emit('initial-state', notInSwarmEvent);
                logger.info('Docker is not part of a swarm');
                return;
            }

            this.isSwarmActive = true;

            const swarm = await docker.swarmInspect();
            this.swarmInfo = this.parseSwarmInfo(swarm, info);

            const nodesList = await docker.listNodes();
            for (const node of nodesList) {
                const parsedNode = this.parseNodeInfo(node);
                this.nodes.set(parsedNode.id, parsedNode);
            }

            const servicesList = await docker.listServices();
            const tasks = await docker.listTasks();

            for (const service of servicesList) {
                const serviceTasks = tasks.filter((t) => t.ServiceID === service.ID);
                const parsedService = this.parseServiceInfo(service, serviceTasks);
                this.services.set(parsedService.id, parsedService);
            }

            logger.info(
                { nodes: this.nodes.size, services: this.services.size },
                'Initial swarm state loaded',
            );

            const initialState: SwarmEvent = {
                type: 'initial',
                swarmInfo: this.swarmInfo,
                nodes: Array.from(this.nodes.values()),
                services: Array.from(this.services.values()),
                timestamp: Date.now(),
            };
            this.emit('initial-state', initialState);
        } catch (err: any) {
            if (err.statusCode === 503 || err.message?.includes('not a swarm manager')) {
                this.isSwarmActive = false;
                const notInSwarmEvent: SwarmEvent = {
                    type: 'not-in-swarm',
                    timestamp: Date.now(),
                };
                this.emit('initial-state', notInSwarmEvent);
                logger.info('Node is not a swarm manager');
            } else {
                logger.error({ err }, 'Error loading initial swarm state');
                throw err;
            }
        }
    }

    async handleDockerEvent(event: any): Promise<void> {
        const eventType = event.Type;
        const action = event.Action;
        const actorId = event.Actor?.ID;

        logger.debug({ eventType, action, actorId }, 'Docker Swarm event received');

        if (eventType === 'node') {
            await this.handleNodeEvent(actorId, action);
        } else if (eventType === 'service') {
            await this.handleServiceEvent(actorId, action);
        }
    }

    private async handleNodeEvent(nodeId: string, action: string): Promise<void> {
        try {
            if (action === 'remove') {
                const oldState = this.nodes.get(nodeId);
                if (oldState) {
                    this.nodes.delete(nodeId);
                    const event: SwarmEvent = {
                        type: 'node-removed',
                        nodeId,
                        oldState,
                        timestamp: Date.now(),
                    };
                    this.emit('node-removed', event);
                }
                return;
            }

            const node = await docker.getNode(nodeId).inspect();
            const parsedNode = this.parseNodeInfo(node);
            const oldState = this.nodes.get(nodeId);
            this.nodes.set(nodeId, parsedNode);

            if (!oldState) {
                const event: SwarmEvent = {
                    type: 'node-added',
                    node: parsedNode,
                    timestamp: Date.now(),
                };
                this.emit('node-added', event);
            } else {
                const event: SwarmEvent = {
                    type: 'node-updated',
                    node: parsedNode,
                    oldState,
                    timestamp: Date.now(),
                };
                this.emit('node-updated', event);
            }
        } catch (err: any) {
            if (err.statusCode === 404) {
                const oldState = this.nodes.get(nodeId);
                this.nodes.delete(nodeId);
                if (oldState) {
                    const event: SwarmEvent = {
                        type: 'node-removed',
                        nodeId,
                        oldState,
                        timestamp: Date.now(),
                    };
                    this.emit('node-removed', event);
                }
            } else {
                logger.error({ err, nodeId }, 'Error handling node event');
            }
        }
    }

    private async handleServiceEvent(serviceId: string, action: string): Promise<void> {
        try {
            if (action === 'remove') {
                const oldState = this.services.get(serviceId);
                if (oldState) {
                    this.services.delete(serviceId);
                    const event: SwarmEvent = {
                        type: 'service-removed',
                        serviceId,
                        oldState,
                        timestamp: Date.now(),
                    };
                    this.emit('service-removed', event);
                }
                return;
            }

            const service = await docker.getService(serviceId).inspect();
            const tasks = await docker.listTasks({ filters: { service: [serviceId] } });
            const parsedService = this.parseServiceInfo(service, tasks);
            const oldState = this.services.get(serviceId);
            this.services.set(serviceId, parsedService);

            if (!oldState) {
                const event: SwarmEvent = {
                    type: 'service-added',
                    service: parsedService,
                    timestamp: Date.now(),
                };
                this.emit('service-added', event);
            } else {
                const event: SwarmEvent = {
                    type: 'service-updated',
                    service: parsedService,
                    oldState,
                    timestamp: Date.now(),
                };
                this.emit('service-updated', event);
            }
        } catch (err: any) {
            if (err.statusCode === 404) {
                const oldState = this.services.get(serviceId);
                this.services.delete(serviceId);
                if (oldState) {
                    const event: SwarmEvent = {
                        type: 'service-removed',
                        serviceId,
                        oldState,
                        timestamp: Date.now(),
                    };
                    this.emit('service-removed', event);
                }
            } else {
                logger.error({ err, serviceId }, 'Error handling service event');
            }
        }
    }

    async fullStateSync(): Promise<void> {
        try {
            const info = await docker.info();
            const wasSwarmActive = this.isSwarmActive;
            const isNowSwarmActive = info.Swarm?.LocalNodeState === 'active';

            if (!wasSwarmActive && isNowSwarmActive) {
                logger.info('Swarm became active, reloading state');
                await this.loadInitialState();
                return;
            }

            if (wasSwarmActive && !isNowSwarmActive) {
                logger.info('Swarm became inactive');
                this.isSwarmActive = false;
                this.swarmInfo = null;
                this.nodes.clear();
                this.services.clear();
                const event: SwarmEvent = {
                    type: 'not-in-swarm',
                    timestamp: Date.now(),
                };
                this.emit('initial-state', event);
                return;
            }

            if (!this.isSwarmActive) return;

            const tasks = await docker.listTasks();

            const servicesList = await docker.listServices();
            for (const service of servicesList) {
                const serviceTasks = tasks.filter((t) => t.ServiceID === service.ID);
                const newState = this.parseServiceInfo(service, serviceTasks);
                const oldState = this.services.get(newState.id);

                if (!oldState) {
                    this.services.set(newState.id, newState);
                    const event: SwarmEvent = {
                        type: 'service-added',
                        service: newState,
                        timestamp: Date.now(),
                    };
                    this.emit('service-added', event);
                } else if (this.hasServiceChanged(oldState, newState)) {
                    this.services.set(newState.id, newState);
                    const event: SwarmEvent = {
                        type: 'service-updated',
                        service: newState,
                        oldState,
                        timestamp: Date.now(),
                    };
                    this.emit('service-updated', event);
                }
            }

            const currentServiceIds = new Set(servicesList.map((s: any) => s.ID));
            for (const [serviceId, oldState] of this.services) {
                if (!currentServiceIds.has(serviceId)) {
                    this.services.delete(serviceId);
                    const event: SwarmEvent = {
                        type: 'service-removed',
                        serviceId,
                        oldState,
                        timestamp: Date.now(),
                    };
                    this.emit('service-removed', event);
                }
            }

            const nodesList = await docker.listNodes();
            for (const node of nodesList) {
                const newState = this.parseNodeInfo(node);
                const oldState = this.nodes.get(newState.id);

                if (!oldState) {
                    this.nodes.set(newState.id, newState);
                    const event: SwarmEvent = {
                        type: 'node-added',
                        node: newState,
                        timestamp: Date.now(),
                    };
                    this.emit('node-added', event);
                } else if (this.hasNodeChanged(oldState, newState)) {
                    this.nodes.set(newState.id, newState);
                    const event: SwarmEvent = {
                        type: 'node-updated',
                        node: newState,
                        oldState,
                        timestamp: Date.now(),
                    };
                    this.emit('node-updated', event);
                }
            }

            const currentNodeIds = new Set(nodesList.map((n: any) => n.ID));
            for (const [nodeId, oldState] of this.nodes) {
                if (!currentNodeIds.has(nodeId)) {
                    this.nodes.delete(nodeId);
                    const event: SwarmEvent = {
                        type: 'node-removed',
                        nodeId,
                        oldState,
                        timestamp: Date.now(),
                    };
                    this.emit('node-removed', event);
                }
            }
        } catch (err) {
            logger.error({ err }, 'Error in swarm full state sync');
        }
    }

    getEventFilters(): Record<string, string[]> {
        return { type: ['node', 'service'] };
    }

    protected onStop(): void {
        this.nodes.clear();
        this.services.clear();
        this.swarmInfo = null;
        this.isSwarmActive = false;
    }

    protected getCustomStats(): Record<string, any> {
        return {
            nodeCount: this.nodes.size,
            serviceCount: this.services.size,
            isSwarmActive: this.isSwarmActive,
        };
    }

    private parseSwarmInfo(swarm: Swarm, info: any): SwarmInfo {
        return {
            id: swarm.ID,
            createdAt: swarm.CreatedAt ? new Date(swarm.CreatedAt).getTime() : Date.now(),
            updatedAt: swarm.UpdatedAt ? new Date(swarm.UpdatedAt).getTime() : Date.now(),
            joinTokens: {
                worker: swarm.JoinTokens?.Worker || '',
                manager: swarm.JoinTokens?.Manager || '',
            },
            managerNodes: info.Swarm?.Managers || 0,
            workerNodes: (info.Swarm?.Nodes || 0) - (info.Swarm?.Managers || 0),
            isManager: info.Swarm?.ControlAvailable || false,
            localNodeId: info.Swarm?.NodeID || '',
            timestamp: Date.now(),
        };
    }

    private parseNodeInfo(node: any): SwarmNode {
        const spec = node.Spec || {};
        const status = node.Status || {};
        const managerStatus = node.ManagerStatus;
        const description = node.Description || {};

        return {
            id: node.ID,
            hostname: description.Hostname || 'unknown',
            status: (status.State?.toLowerCase() || 'unknown') as SwarmNodeStatus,
            availability: (spec.Availability?.toLowerCase() || 'active') as SwarmNodeAvailability,
            role: (spec.Role?.toLowerCase() || 'worker') as 'manager' | 'worker',
            address: status.Addr || '',
            engineVersion: description.Engine?.EngineVersion || '',
            labels: spec.Labels || {},
            managerStatus: managerStatus
                ? {
                      leader: managerStatus.Leader || false,
                      reachability: managerStatus.Reachability || '',
                      addr: managerStatus.Addr || '',
                  }
                : undefined,
            resources: {
                nanoCPUs: description.Resources?.NanoCPUs || 0,
                memoryBytes: description.Resources?.MemoryBytes || 0,
            },
            createdAt: node.CreatedAt ? new Date(node.CreatedAt).getTime() : Date.now(),
            updatedAt: node.UpdatedAt ? new Date(node.UpdatedAt).getTime() : Date.now(),
            timestamp: Date.now(),
        };
    }

    private parseServiceInfo(service: any, tasks: any[]): SwarmService {
        const spec = service.Spec || {};
        const mode = spec.Mode || {};
        const endpointSpec = spec.EndpointSpec || {};

        const isReplicated = !!mode.Replicated;
        const replicas = isReplicated ? mode.Replicated?.Replicas || 0 : 0;

        const runningTasks = tasks.filter(
            (t) => t.Status?.State === 'running' && t.DesiredState === 'running',
        );

        const ports = (endpointSpec.Ports || []).map((p: any) => ({
            protocol: p.Protocol || 'tcp',
            targetPort: p.TargetPort || 0,
            publishedPort: p.PublishedPort || 0,
            publishMode: p.PublishMode || 'ingress',
        }));

        return {
            id: service.ID,
            name: spec.Name || '',
            mode: isReplicated ? 'replicated' : 'global',
            replicas,
            runningReplicas: runningTasks.length,
            image: spec.TaskTemplate?.ContainerSpec?.Image || '',
            ports,
            labels: spec.Labels || {},
            createdAt: service.CreatedAt ? new Date(service.CreatedAt).getTime() : Date.now(),
            updatedAt: service.UpdatedAt ? new Date(service.UpdatedAt).getTime() : Date.now(),
            timestamp: Date.now(),
        };
    }

    private hasNodeChanged(oldState: SwarmNode, newState: SwarmNode): boolean {
        return (
            oldState.status !== newState.status ||
            oldState.availability !== newState.availability ||
            oldState.role !== newState.role ||
            JSON.stringify(oldState.labels) !== JSON.stringify(newState.labels) ||
            oldState.managerStatus?.leader !== newState.managerStatus?.leader ||
            oldState.managerStatus?.reachability !== newState.managerStatus?.reachability
        );
    }

    private hasServiceChanged(oldState: SwarmService, newState: SwarmService): boolean {
        return (
            oldState.replicas !== newState.replicas ||
            oldState.runningReplicas !== newState.runningReplicas ||
            oldState.image !== newState.image ||
            JSON.stringify(oldState.ports) !== JSON.stringify(newState.ports) ||
            JSON.stringify(oldState.labels) !== JSON.stringify(newState.labels)
        );
    }

    getAllNodes(): SwarmNode[] {
        return Array.from(this.nodes.values());
    }

    getAllServices(): SwarmService[] {
        return Array.from(this.services.values());
    }

    getSwarmInfo(): SwarmInfo | null {
        return this.swarmInfo;
    }

    getIsSwarmActive(): boolean {
        return this.isSwarmActive;
    }

    getNode(nodeId: string): SwarmNode | undefined {
        return this.nodes.get(nodeId);
    }

    getService(serviceId: string): SwarmService | undefined {
        return this.services.get(serviceId);
    }

    async hardRefresh(): Promise<void> {
        logger.info('Starting hard refresh of swarm state');
        await this.loadInitialState();
        logger.info('Hard refresh of swarm state completed');
    }
}

export const swarmStateManager = new SwarmStateManager();
