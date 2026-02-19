import { logger } from '@/utils/logger';
import { BaseStateManager } from '@/lib/BaseStateManager';
import type { Swarm } from 'dockerode';
import type {
    SwarmEvent,
    SwarmInfo,
    SwarmNode,
    SwarmNodeAvailability,
    SwarmNodeChanges,
    SwarmNodeRole,
    SwarmNodeState,
    SwarmService,
    SwarmServiceChanges,
    SwarmServiceMode,
    SwarmStats,
    SwarmTask,
    SwarmTaskChanges,
    SwarmTaskDesiredState,
    SwarmTaskState,
} from '@workspace/typescript-interface/docker/swarm';
import { getCurrentEnvironmentId } from '@/lib/dockerContext';
import { dockerClientRegistry } from '@/lib/dockerClientRegistry';
import { stateManagerFactory } from '@/managers/factory/StateManagerFactory';

const PENDING_TASK_STATES = new Set<SwarmTaskState>([
    'new',
    'pending',
    'assigned',
    'accepted',
    'preparing',
    'ready',
    'starting',
]);

export class SwarmStateManager extends BaseStateManager {
    private nodes: Map<string, SwarmNode> = new Map();
    private services: Map<string, SwarmService> = new Map();
    private tasks: Map<string, SwarmTask> = new Map();
    private swarmInfo: SwarmInfo | null = null;
    private isSwarmActive: boolean = false;

    constructor(environmentId: string) {
        super({
            managerName: `Swarm State Manager [${environmentId}]`,
            environmentId,
            pollIntervalMs: 10000,
            maxReconnectAttempts: 5,
            maxListeners: 100,
        });
    }

    async loadInitialState(): Promise<void> {
        try {
            if (!this.getDockerStatusManager().isConnected()) {
                logger.warn('Cannot load initial state: Docker is not connected');
                return;
            }
        } catch (err) {
            logger.warn('Cannot load initial state: Docker status manager not available');
            return;
        }

        try {
            const info = await this.docker.info();

            if (!info.Swarm || info.Swarm.LocalNodeState !== 'active') {
                this.isSwarmActive = false;
                this.swarmInfo = null;
                this.nodes.clear();
                this.services.clear();
                this.tasks.clear();

                const notInSwarmEvent: SwarmEvent = {
                    type: 'not-in-swarm',
                    isSwarmActive: false,
                    timestamp: Date.now(),
                };
                this.emit('initial-state', notInSwarmEvent);
                logger.info('Docker is not part of a swarm');
                return;
            }

            this.isSwarmActive = true;

            const [swarm, nodesList] = await Promise.all([
                this.docker.swarmInspect(),
                this.docker.listNodes(),
            ]);
            this.swarmInfo = this.parseSwarmInfo(swarm, info);

            for (const node of nodesList) {
                const parsedNode = this.parseNodeInfo(node);
                this.nodes.set(parsedNode.id, parsedNode);
            }

            const [servicesList, tasksList] = await Promise.all([
                this.docker.listServices(),
                this.docker.listTasks(),
            ]);

            const serviceTaskCounts = new Map<string, { running: number; total: number }>();
            for (const task of tasksList) {
                const serviceId = task.ServiceID;
                if (!serviceTaskCounts.has(serviceId)) {
                    serviceTaskCounts.set(serviceId, { running: 0, total: 0 });
                }
                const counts = serviceTaskCounts.get(serviceId)!;
                counts.total++;
                if (task.Status?.State === 'running' && task.DesiredState === 'running') {
                    counts.running++;
                }
            }

            for (const service of servicesList) {
                const counts = serviceTaskCounts.get(service.ID) || { running: 0, total: 0 };
                const parsedService = this.parseServiceInfo(service, counts.running);
                this.services.set(parsedService.id, parsedService);
            }

            for (const task of tasksList) {
                const service = this.services.get(task.ServiceID);
                const node = task.NodeID ? this.nodes.get(task.NodeID) : undefined;
                const parsedTask = this.parseTaskInfo(task, service?.name, node?.hostname);
                this.tasks.set(parsedTask.id, parsedTask);
            }

            logger.info(
                {
                    nodes: this.nodes.size,
                    services: this.services.size,
                    tasks: this.tasks.size,
                },
                'Initial swarm state loaded',
            );

            const initialState: SwarmEvent = {
                type: 'initial',
                isSwarmActive: true,
                swarmInfo: this.swarmInfo,
                nodes: Array.from(this.nodes.values()),
                services: Array.from(this.services.values()),
                tasks: Array.from(this.tasks.values()),
                timestamp: Date.now(),
            };
            this.emit('initial-state', initialState);
        } catch (err: any) {
            if (err.statusCode === 503 || err.message?.includes('not a swarm manager')) {
                this.isSwarmActive = false;
                const notInSwarmEvent: SwarmEvent = {
                    type: 'not-in-swarm',
                    isSwarmActive: false,
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
                const previousNode = this.nodes.get(nodeId);
                if (previousNode) {
                    this.nodes.delete(nodeId);
                    const event: SwarmEvent = {
                        type: 'node-removed',
                        nodeId,
                        previousNode,
                        timestamp: Date.now(),
                    };
                    this.emit('node-removed', event);
                }
                return;
            }

            const node = await this.docker.getNode(nodeId).inspect();
            const parsedNode = this.parseNodeInfo(node);
            const previousNode = this.nodes.get(nodeId);
            this.nodes.set(nodeId, parsedNode);

            if (!previousNode) {
                const event: SwarmEvent = {
                    type: 'node-added',
                    node: parsedNode,
                    timestamp: Date.now(),
                };
                this.emit('node-added', event);
            } else {
                const changes = this.getNodeChanges(previousNode, parsedNode);
                if (Object.keys(changes).length > 0) {
                    const event: SwarmEvent = {
                        type: 'node-updated',
                        node: parsedNode,
                        previousNode,
                        changes,
                        timestamp: Date.now(),
                    };
                    this.emit('node-updated', event);
                }
            }
        } catch (err: any) {
            if (err.statusCode === 404) {
                const previousNode = this.nodes.get(nodeId);
                this.nodes.delete(nodeId);
                if (previousNode) {
                    const event: SwarmEvent = {
                        type: 'node-removed',
                        nodeId,
                        previousNode,
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
                const previousService = this.services.get(serviceId);
                if (previousService) {
                    this.services.delete(serviceId);

                    for (const [taskId, task] of this.tasks) {
                        if (task.serviceId === serviceId) {
                            this.tasks.delete(taskId);
                            const taskEvent: SwarmEvent = {
                                type: 'task-removed',
                                taskId,
                                previousTask: task,
                                timestamp: Date.now(),
                            };
                            this.emit('task-removed', taskEvent);
                        }
                    }

                    const event: SwarmEvent = {
                        type: 'service-removed',
                        serviceId,
                        previousService,
                        timestamp: Date.now(),
                    };
                    this.emit('service-removed', event);
                }
                return;
            }

            const service = await this.docker.getService(serviceId).inspect();
            const tasksList = await this.docker.listTasks({ filters: { service: [serviceId] } });

            const runningCount = tasksList.filter(
                (t: any) => t.Status?.State === 'running' && t.DesiredState === 'running',
            ).length;

            const parsedService = this.parseServiceInfo(service, runningCount);
            const previousService = this.services.get(serviceId);
            this.services.set(serviceId, parsedService);

            for (const task of tasksList) {
                const node = task.NodeID ? this.nodes.get(task.NodeID) : undefined;
                const parsedTask = this.parseTaskInfo(task, parsedService.name, node?.hostname);
                const previousTask = this.tasks.get(parsedTask.id);
                this.tasks.set(parsedTask.id, parsedTask);

                if (!previousTask) {
                    const taskEvent: SwarmEvent = {
                        type: 'task-added',
                        task: parsedTask,
                        timestamp: Date.now(),
                    };
                    this.emit('task-added', taskEvent);
                } else {
                    const taskChanges = this.getTaskChanges(previousTask, parsedTask);
                    if (Object.keys(taskChanges).length > 0) {
                        const taskEvent: SwarmEvent = {
                            type: 'task-updated',
                            task: parsedTask,
                            previousTask,
                            changes: taskChanges,
                            timestamp: Date.now(),
                        };
                        this.emit('task-updated', taskEvent);
                    }
                }
            }

            if (!previousService) {
                const event: SwarmEvent = {
                    type: 'service-added',
                    service: parsedService,
                    timestamp: Date.now(),
                };
                this.emit('service-added', event);
            } else {
                const changes = this.getServiceChanges(previousService, parsedService);
                if (Object.keys(changes).length > 0) {
                    const event: SwarmEvent = {
                        type: 'service-updated',
                        service: parsedService,
                        previousService,
                        changes,
                        timestamp: Date.now(),
                    };
                    this.emit('service-updated', event);
                }
            }
        } catch (err: any) {
            if (err.statusCode === 404) {
                const previousService = this.services.get(serviceId);
                this.services.delete(serviceId);
                if (previousService) {
                    const event: SwarmEvent = {
                        type: 'service-removed',
                        serviceId,
                        previousService,
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
            const info = await this.docker.info();
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
                this.tasks.clear();
                const event: SwarmEvent = {
                    type: 'not-in-swarm',
                    isSwarmActive: false,
                    timestamp: Date.now(),
                };
                this.emit('initial-state', event);
                return;
            }

            if (!this.isSwarmActive) return;

            await this.syncNodes();
            await this.syncServicesAndTasks();
        } catch (err) {
            logger.error({ err }, 'Error in swarm full state sync');
        }
    }

    private async syncNodes(): Promise<void> {
        const nodesList = await this.docker.listNodes();
        const currentNodeIds = new Set<string>();

        for (const node of nodesList) {
            const parsedNode = this.parseNodeInfo(node);
            currentNodeIds.add(parsedNode.id);
            const previousNode = this.nodes.get(parsedNode.id);

            if (!previousNode) {
                this.nodes.set(parsedNode.id, parsedNode);
                const event: SwarmEvent = {
                    type: 'node-added',
                    node: parsedNode,
                    timestamp: Date.now(),
                };
                this.emit('node-added', event);
            } else {
                const changes = this.getNodeChanges(previousNode, parsedNode);
                if (Object.keys(changes).length > 0) {
                    this.nodes.set(parsedNode.id, parsedNode);
                    const event: SwarmEvent = {
                        type: 'node-updated',
                        node: parsedNode,
                        previousNode,
                        changes,
                        timestamp: Date.now(),
                    };
                    this.emit('node-updated', event);
                }
            }
        }

        for (const [nodeId, previousNode] of this.nodes) {
            if (!currentNodeIds.has(nodeId)) {
                this.nodes.delete(nodeId);
                const event: SwarmEvent = {
                    type: 'node-removed',
                    nodeId,
                    previousNode,
                    timestamp: Date.now(),
                };
                this.emit('node-removed', event);
            }
        }
    }

    private async syncServicesAndTasks(): Promise<void> {
        const [servicesList, tasksList] = await Promise.all([
            this.docker.listServices(),
            this.docker.listTasks(),
        ]);
        const currentServiceIds = new Set<string>();
        const currentTaskIds = new Set<string>();

        const serviceTaskCounts = new Map<string, { running: number; total: number }>();
        for (const task of tasksList) {
            const serviceId = task.ServiceID;
            if (!serviceTaskCounts.has(serviceId)) {
                serviceTaskCounts.set(serviceId, { running: 0, total: 0 });
            }
            const counts = serviceTaskCounts.get(serviceId)!;
            counts.total++;
            if (task.Status?.State === 'running' && task.DesiredState === 'running') {
                counts.running++;
            }
        }

        for (const service of servicesList) {
            const counts = serviceTaskCounts.get(service.ID) || { running: 0, total: 0 };
            const parsedService = this.parseServiceInfo(service, counts.running);
            currentServiceIds.add(parsedService.id);
            const previousService = this.services.get(parsedService.id);

            if (!previousService) {
                this.services.set(parsedService.id, parsedService);
                const event: SwarmEvent = {
                    type: 'service-added',
                    service: parsedService,
                    timestamp: Date.now(),
                };
                this.emit('service-added', event);
            } else {
                const changes = this.getServiceChanges(previousService, parsedService);
                if (Object.keys(changes).length > 0) {
                    this.services.set(parsedService.id, parsedService);
                    const event: SwarmEvent = {
                        type: 'service-updated',
                        service: parsedService,
                        previousService,
                        changes,
                        timestamp: Date.now(),
                    };
                    this.emit('service-updated', event);
                }
            }
        }

        for (const task of tasksList) {
            const service = this.services.get(task.ServiceID);
            const node = task.NodeID ? this.nodes.get(task.NodeID) : undefined;
            const parsedTask = this.parseTaskInfo(task, service?.name, node?.hostname);
            currentTaskIds.add(parsedTask.id);
            const previousTask = this.tasks.get(parsedTask.id);

            if (!previousTask) {
                this.tasks.set(parsedTask.id, parsedTask);
                const event: SwarmEvent = {
                    type: 'task-added',
                    task: parsedTask,
                    timestamp: Date.now(),
                };
                this.emit('task-added', event);
            } else {
                const changes = this.getTaskChanges(previousTask, parsedTask);
                if (Object.keys(changes).length > 0) {
                    this.tasks.set(parsedTask.id, parsedTask);
                    const event: SwarmEvent = {
                        type: 'task-updated',
                        task: parsedTask,
                        previousTask,
                        changes,
                        timestamp: Date.now(),
                    };
                    this.emit('task-updated', event);
                }
            }
        }

        for (const [serviceId, previousService] of this.services) {
            if (!currentServiceIds.has(serviceId)) {
                this.services.delete(serviceId);
                const event: SwarmEvent = {
                    type: 'service-removed',
                    serviceId,
                    previousService,
                    timestamp: Date.now(),
                };
                this.emit('service-removed', event);
            }
        }

        for (const [taskId, previousTask] of this.tasks) {
            if (!currentTaskIds.has(taskId)) {
                this.tasks.delete(taskId);
                const event: SwarmEvent = {
                    type: 'task-removed',
                    taskId,
                    previousTask,
                    timestamp: Date.now(),
                };
                this.emit('task-removed', event);
            }
        }
    }

    getEventFilters(): Record<string, string[]> {
        return { type: ['node', 'service'] };
    }

    protected onStop(): void {
        this.nodes.clear();
        this.services.clear();
        this.tasks.clear();
        this.swarmInfo = null;
        this.isSwarmActive = false;
    }

    protected getCustomStats(): Record<string, any> {
        return {
            nodeCount: this.nodes.size,
            serviceCount: this.services.size,
            taskCount: this.tasks.size,
            isSwarmActive: this.isSwarmActive,
        };
    }

    private parseSwarmInfo(swarm: Swarm, info: any): SwarmInfo {
        return {
            id: swarm.ID,
            version: swarm.Version?.Index || 0,
            createdAt: swarm.CreatedAt ? new Date(swarm.CreatedAt).getTime() : Date.now(),
            updatedAt: swarm.UpdatedAt ? new Date(swarm.UpdatedAt).getTime() : Date.now(),
            joinTokens: {
                worker: swarm.JoinTokens?.Worker || '',
                manager: swarm.JoinTokens?.Manager || '',
            },
            totalNodes: info.Swarm?.Nodes || 0,
            managerNodes: info.Swarm?.Managers || 0,
            workerNodes: (info.Swarm?.Nodes || 0) - (info.Swarm?.Managers || 0),
            isManager: info.Swarm?.ControlAvailable || false,
            localNodeId: info.Swarm?.NodeID || '',
            dataPathPort: swarm.DataPathPort || 4789,
        };
    }

    private parseNodeInfo(node: any): SwarmNode {
        const spec = node.Spec || {};
        const status = node.Status || {};
        const managerStatus = node.ManagerStatus;
        const description = node.Description || {};

        return {
            id: node.ID,
            version: node.Version?.Index || 0,
            createdAt: node.CreatedAt ? new Date(node.CreatedAt).getTime() : Date.now(),
            updatedAt: node.UpdatedAt ? new Date(node.UpdatedAt).getTime() : Date.now(),
            hostname: description.Hostname || 'unknown',
            role: (spec.Role?.toLowerCase() || 'worker') as SwarmNodeRole,
            availability: (spec.Availability?.toLowerCase() || 'active') as SwarmNodeAvailability,
            state: (status.State?.toLowerCase() || 'unknown') as SwarmNodeState,
            address: status.Addr || '',
            engineVersion: description.Engine?.EngineVersion || '',
            platform: {
                architecture: description.Platform?.Architecture || '',
                os: description.Platform?.OS || '',
            },
            resources: {
                nanoCPUs: description.Resources?.NanoCPUs || 0,
                memoryBytes: description.Resources?.MemoryBytes || 0,
            },
            labels: spec.Labels || {},
            managerStatus: managerStatus
                ? {
                      leader: managerStatus.Leader || false,
                      reachability: (managerStatus.Reachability?.toLowerCase() || 'unknown') as
                          | 'unknown'
                          | 'unreachable'
                          | 'reachable',
                      addr: managerStatus.Addr || '',
                  }
                : undefined,
        };
    }

    private parseServiceInfo(service: any, runningReplicas: number): SwarmService {
        const spec = service.Spec || {};
        const mode = spec.Mode || {};
        const endpointSpec = spec.EndpointSpec || {};
        const taskTemplate = spec.TaskTemplate || {};
        const containerSpec = taskTemplate.ContainerSpec || {};

        const isReplicated = !!mode.Replicated;
        const isGlobal = !!mode.Global;
        const isReplicatedJob = !!mode.ReplicatedJob;
        const isGlobalJob = !!mode.GlobalJob;

        let serviceMode: SwarmServiceMode = 'replicated';
        let replicas = 0;

        if (isReplicated) {
            serviceMode = 'replicated';
            replicas = mode.Replicated?.Replicas || 0;
        } else if (isGlobal) {
            serviceMode = 'global';
            replicas = this.nodes.size;
        } else if (isReplicatedJob) {
            serviceMode = 'replicated-job';
            replicas = mode.ReplicatedJob?.TotalCompletions || 0;
        } else if (isGlobalJob) {
            serviceMode = 'global-job';
            replicas = this.nodes.size;
        }

        const ports = (endpointSpec.Ports || []).map((p: any) => ({
            protocol: (p.Protocol?.toLowerCase() || 'tcp') as 'tcp' | 'udp' | 'sctp',
            targetPort: p.TargetPort || 0,
            publishedPort: p.PublishedPort || 0,
            publishMode: (p.PublishMode?.toLowerCase() || 'ingress') as 'ingress' | 'host',
        }));

        const placement = taskTemplate.Placement || {};

        return {
            id: service.ID,
            version: service.Version?.Index || 0,
            createdAt: service.CreatedAt ? new Date(service.CreatedAt).getTime() : Date.now(),
            updatedAt: service.UpdatedAt ? new Date(service.UpdatedAt).getTime() : Date.now(),
            name: spec.Name || '',
            mode: serviceMode,
            replicas,
            runningReplicas,
            image: containerSpec.Image || '',
            ports,
            labels: spec.Labels || {},
            env: containerSpec.Env || [],
            constraints: placement.Constraints || [],
            networks: (spec.Networks || []).map((n: any) => n.Target),
            updateStatus: service.UpdateStatus
                ? {
                      state: service.UpdateStatus.State?.toLowerCase() as any,
                      startedAt: service.UpdateStatus.StartedAt
                          ? new Date(service.UpdateStatus.StartedAt).getTime()
                          : undefined,
                      completedAt: service.UpdateStatus.CompletedAt
                          ? new Date(service.UpdateStatus.CompletedAt).getTime()
                          : undefined,
                      message: service.UpdateStatus.Message,
                  }
                : undefined,
            previousSpec: !!service.PreviousSpec,
        };
    }

    private parseTaskInfo(task: any, serviceName?: string, nodeHostname?: string): SwarmTask {
        const status = task.Status || {};
        const containerStatus = status.ContainerStatus;
        const spec = task.Spec || {};
        const containerSpec = spec.ContainerSpec || {};

        return {
            id: task.ID,
            version: task.Version?.Index || 0,
            createdAt: task.CreatedAt ? new Date(task.CreatedAt).getTime() : Date.now(),
            updatedAt: task.UpdatedAt ? new Date(task.UpdatedAt).getTime() : Date.now(),
            serviceId: task.ServiceID,
            serviceName: serviceName || '',
            nodeId: task.NodeID,
            nodeHostname: nodeHostname,
            slot: task.Slot,
            state: (status.State?.toLowerCase() || 'unknown') as SwarmTaskState,
            desiredState: (task.DesiredState?.toLowerCase() || 'running') as SwarmTaskDesiredState,
            message: status.Message,
            error: status.Err,
            containerStatus: containerStatus
                ? {
                      containerId: containerStatus.ContainerID,
                      pid: containerStatus.PID,
                      exitCode: containerStatus.ExitCode,
                  }
                : undefined,
            image: containerSpec.Image || '',
        };
    }

    private getNodeChanges(previous: SwarmNode, current: SwarmNode): SwarmNodeChanges {
        const changes: SwarmNodeChanges = {};

        if (previous.role !== current.role) {
            changes.role = { from: previous.role, to: current.role };
        }
        if (previous.availability !== current.availability) {
            changes.availability = { from: previous.availability, to: current.availability };
        }
        if (previous.state !== current.state) {
            changes.state = { from: previous.state, to: current.state };
        }

        const prevLabels = Object.keys(previous.labels);
        const currLabels = Object.keys(current.labels);
        const prevLabelsSet = new Set(prevLabels);
        const currLabelsSet = new Set(currLabels);
        const added = currLabels.filter((k) => !prevLabelsSet.has(k));
        const removed = prevLabels.filter((k) => !currLabelsSet.has(k));
        const changed = currLabels.filter(
            (k) => prevLabelsSet.has(k) && previous.labels[k] !== current.labels[k],
        );

        if (added.length > 0 || removed.length > 0 || changed.length > 0) {
            changes.labels = { added, removed, changed };
        }

        const prevLeader = previous.managerStatus?.leader;
        const currLeader = current.managerStatus?.leader;
        const prevReach = previous.managerStatus?.reachability;
        const currReach = current.managerStatus?.reachability;
        if (prevLeader !== currLeader || prevReach !== currReach) {
            changes.managerStatus = true;
        }

        return changes;
    }

    private getServiceChanges(previous: SwarmService, current: SwarmService): SwarmServiceChanges {
        const changes: SwarmServiceChanges = {};

        if (previous.replicas !== current.replicas) {
            changes.replicas = { from: previous.replicas, to: current.replicas };
        }
        if (previous.runningReplicas !== current.runningReplicas) {
            changes.runningReplicas = {
                from: previous.runningReplicas,
                to: current.runningReplicas,
            };
        }
        if (previous.image !== current.image) {
            changes.image = { from: previous.image, to: current.image };
        }
        if (previous.updateStatus?.state !== current.updateStatus?.state) {
            changes.updateStatus = true;
        }

        return changes;
    }

    private getTaskChanges(previous: SwarmTask, current: SwarmTask): SwarmTaskChanges {
        const changes: SwarmTaskChanges = {};

        if (previous.state !== current.state) {
            changes.state = { from: previous.state, to: current.state };
        }
        if (previous.desiredState !== current.desiredState) {
            changes.desiredState = { from: previous.desiredState, to: current.desiredState };
        }
        if (previous.nodeId !== current.nodeId) {
            changes.nodeId = { from: previous.nodeId, to: current.nodeId };
        }
        if (current.message && previous.message !== current.message) {
            changes.message = current.message;
        }
        if (current.error && previous.error !== current.error) {
            changes.error = current.error;
        }

        return changes;
    }

    getAllNodes(): SwarmNode[] {
        return Array.from(this.nodes.values());
    }

    getAllServices(): SwarmService[] {
        return Array.from(this.services.values());
    }

    getAllTasks(): SwarmTask[] {
        return Array.from(this.tasks.values());
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

    getTask(taskId: string): SwarmTask | undefined {
        return this.tasks.get(taskId);
    }

    getTasksByService(serviceId: string): SwarmTask[] {
        return Array.from(this.tasks.values()).filter((t) => t.serviceId === serviceId);
    }

    getTasksByNode(nodeId: string): SwarmTask[] {
        return Array.from(this.tasks.values()).filter((t) => t.nodeId === nodeId);
    }

    getSwarmStats(): SwarmStats {
        let managerNodes = 0;
        let workerNodes = 0;
        let healthyNodes = 0;
        for (const n of this.nodes.values()) {
            if (n.role === 'manager') managerNodes++;
            if (n.role === 'worker') workerNodes++;
            if (n.state === 'ready') healthyNodes++;
        }

        let runningTasks = 0;
        let pendingTasks = 0;
        let failedTasks = 0;
        let totalTasks = 0;
        for (const t of this.tasks.values()) {
            totalTasks++;
            if (t.state === 'running') runningTasks++;
            else if (t.state === 'failed') failedTasks++;
            else if (PENDING_TASK_STATES.has(t.state as SwarmTaskState)) pendingTasks++;
        }

        return {
            isSwarmActive: this.isSwarmActive,
            totalNodes: this.nodes.size,
            managerNodes,
            workerNodes,
            healthyNodes,
            totalServices: this.services.size,
            totalTasks,
            runningTasks,
            pendingTasks,
            failedTasks,
        };
    }

    async hardRefresh(): Promise<void> {
        logger.info('Starting hard refresh of swarm state');
        await this.loadInitialState();
        logger.info('Hard refresh of swarm state completed');
    }
}

export function getSwarmStateManager(): SwarmStateManager {
    const environmentId = getCurrentEnvironmentId();
    if (!environmentId) {
        const defaultId = dockerClientRegistry.getDefaultEnvironmentId();
        if (!defaultId) {
            throw new Error('No Docker environment available');
        }
        return stateManagerFactory.getManagers(defaultId).swarm;
    }
    return stateManagerFactory.getManagers(environmentId).swarm;
}

export const swarmStateManager = new Proxy({} as SwarmStateManager, {
    get(_target, prop) {
        const manager = getSwarmStateManager();
        const value = (manager as any)[prop];
        if (typeof value === 'function') {
            return value.bind(manager);
        }
        return value;
    },
});
