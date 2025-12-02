import { docker } from '@/utils/dockerClient';
import { handleAsync } from '@/helpers/handleAsync';
import { Hono } from 'hono';
import { swarmStateManager } from '@/managers/swarmStateManager';

const app = new Hono();

app.post(
    '/hardRefresh',
    handleAsync(async () => {
        await swarmStateManager.hardRefresh();
        return { success: true };
    }),
);

app.get(
    '/',
    handleAsync(async () => {
        return {
            isSwarmActive: swarmStateManager.getIsSwarmActive(),
            swarmInfo: swarmStateManager.getSwarmInfo(),
            nodes: swarmStateManager.getAllNodes(),
            services: swarmStateManager.getAllServices(),
        };
    }),
);

app.get(
    '/info',
    handleAsync(async () => {
        return swarmStateManager.getSwarmInfo();
    }),
);

app.get(
    '/nodes',
    handleAsync(async () => {
        return swarmStateManager.getAllNodes();
    }),
);

app.get(
    '/nodes/:id',
    handleAsync(async (c) => {
        const nodeId = c.req.param('id');
        const node = swarmStateManager.getNode(nodeId);
        if (!node) {
            return c.json({ error: 'Node not found' }, 404);
        }
        return node;
    }),
);

app.post(
    '/nodes/:id/update',
    handleAsync(async (c) => {
        const nodeId = c.req.param('id');
        const { availability, role, labels } = await c.req.json();

        const node = docker.getNode(nodeId);
        const nodeInfo = await node.inspect();

        const spec: any = {
            ...nodeInfo.Spec,
        };

        if (availability) spec.Availability = availability;
        if (role) spec.Role = role;
        if (labels) spec.Labels = labels;

        node.update({
            version: nodeInfo.Version.Index,
            ...spec,
        });

        return { success: true, nodeId };
    }),
);

app.delete(
    '/nodes/:id',
    handleAsync(async (c) => {
        const nodeId = c.req.param('id');
        const { force } = await c.req.json().catch(() => ({ force: false }));

        const node = docker.getNode(nodeId);
        await node.remove({ force });

        return { success: true, nodeId };
    }),
);

app.get(
    '/services',
    handleAsync(async () => {
        return swarmStateManager.getAllServices();
    }),
);

app.get(
    '/services/:id',
    handleAsync(async (c) => {
        const serviceId = c.req.param('id');
        const service = swarmStateManager.getService(serviceId);
        if (!service) {
            return c.json({ error: 'Service not found' }, 404);
        }
        return service;
    }),
);

app.post(
    '/services/:id/scale',
    handleAsync(async (c) => {
        const serviceId = c.req.param('id');
        const { replicas } = await c.req.json();

        if (typeof replicas !== 'number' || replicas < 0) {
            return c.json({ error: 'Invalid replicas count' }, 400);
        }

        const service = docker.getService(serviceId);
        const serviceInfo = await service.inspect();

        if (!serviceInfo.Spec.Mode.Replicated) {
            return c.json({ error: 'Cannot scale a global service' }, 400);
        }

        await service.update({
            version: serviceInfo.Version.Index,
            ...serviceInfo.Spec,
            Mode: {
                Replicated: { Replicas: replicas },
            },
        });

        return { success: true, serviceId, replicas };
    }),
);

app.delete(
    '/services/:id',
    handleAsync(async (c) => {
        const serviceId = c.req.param('id');

        const service = docker.getService(serviceId);
        await service.remove();

        return { success: true, serviceId };
    }),
);

app.post(
    '/init',
    handleAsync(async (c) => {
        const { advertiseAddr, listenAddr } = await c.req.json();

        const result = await docker.swarmInit({
            AdvertiseAddr: advertiseAddr,
            ListenAddr: listenAddr || '0.0.0.0:2377',
        });

        await swarmStateManager.hardRefresh();

        return { success: true, nodeId: result };
    }),
);

app.post(
    '/leave',
    handleAsync(async (c) => {
        const { force } = await c.req.json().catch(() => ({ force: false }));

        await docker.swarmLeave({ force });
        await swarmStateManager.hardRefresh();

        return { success: true };
    }),
);

app.get(
    '/join-token',
    handleAsync(async () => {
        const swarm = await docker.swarmInspect();
        return {
            worker: swarm.JoinTokens?.Worker,
            manager: swarm.JoinTokens?.Manager,
        };
    }),
);

app.post(
    '/services/create',
    handleAsync(async (c) => {
        const {
            name,
            image,
            replicas = 1,
            ports = [],
            env = [],
            labels = {},
            networks = [],
            constraints = [],
            resources,
        } = await c.req.json();

        if (!name || !image) {
            return c.json({ error: 'Name and image are required' }, 400);
        }

        const portConfigs = ports.map((p: any) => ({
            Protocol: p.protocol || 'tcp',
            TargetPort: p.targetPort,
            PublishedPort: p.publishedPort,
            PublishMode: p.publishMode || 'ingress',
        }));

        const serviceSpec: any = {
            Name: name,
            Labels: labels,
            TaskTemplate: {
                ContainerSpec: {
                    Image: image,
                    Env: env,
                },
                Placement: constraints.length > 0 ? { Constraints: constraints } : undefined,
                Resources: resources
                    ? {
                          Limits: resources.limits
                              ? {
                                    NanoCPUs: resources.limits.cpus
                                        ? resources.limits.cpus * 1e9
                                        : undefined,
                                    MemoryBytes: resources.limits.memory,
                                }
                              : undefined,
                          Reservations: resources.reservations
                              ? {
                                    NanoCPUs: resources.reservations.cpus
                                        ? resources.reservations.cpus * 1e9
                                        : undefined,
                                    MemoryBytes: resources.reservations.memory,
                                }
                              : undefined,
                      }
                    : undefined,
            },
            Mode: {
                Replicated: { Replicas: replicas },
            },
            EndpointSpec: portConfigs.length > 0 ? { Ports: portConfigs } : undefined,
            Networks:
                networks.length > 0 ? networks.map((n: string) => ({ Target: n })) : undefined,
        };

        const service = await docker.createService(serviceSpec);

        return {
            success: true,
            serviceId: service.id,
            name,
        };
    }),
);

app.post(
    '/services/:id/update',
    handleAsync(async (c) => {
        const serviceId = c.req.param('id');
        const updates = await c.req.json();

        const service = docker.getService(serviceId);
        const serviceInfo = await service.inspect();

        const newSpec = { ...serviceInfo.Spec };

        if (updates.image) {
            newSpec.TaskTemplate.ContainerSpec.Image = updates.image;
        }

        if (updates.env) {
            newSpec.TaskTemplate.ContainerSpec.Env = updates.env;
        }

        if (updates.replicas !== undefined && newSpec.Mode.Replicated) {
            newSpec.Mode.Replicated.Replicas = updates.replicas;
        }

        if (updates.labels) {
            newSpec.Labels = { ...newSpec.Labels, ...updates.labels };
        }

        await service.update({
            version: serviceInfo.Version.Index,
            ...newSpec,
        });

        return { success: true, serviceId };
    }),
);

app.post(
    '/services/:id/rollback',
    handleAsync(async (c) => {
        const serviceId = c.req.param('id');

        const service = docker.getService(serviceId);
        const serviceInfo = await service.inspect();

        if (!serviceInfo.PreviousSpec) {
            return c.json({ error: 'No previous version to rollback to' }, 400);
        }

        await service.update({
            version: serviceInfo.Version.Index,
            ...serviceInfo.PreviousSpec,
        });

        return { success: true, serviceId };
    }),
);

app.get(
    '/services/:id/logs',
    handleAsync(async (c) => {
        const serviceId = c.req.param('id');
        const tail = c.req.query('tail') || '100';

        const service = docker.getService(serviceId);
        const logs = await service.logs({
            stdout: true,
            stderr: true,
            tail: parseInt(tail),
            timestamps: true,
        });

        return { logs: logs.toString() };
    }),
);

app.get(
    '/tasks',
    handleAsync(async () => {
        const tasks = await docker.listTasks();
        return tasks.map((task: any) => ({
            id: task.ID,
            serviceId: task.ServiceID,
            nodeId: task.NodeID,
            status: task.Status?.State,
            desiredState: task.DesiredState,
            containerId: task.Status?.ContainerStatus?.ContainerID,
            createdAt: task.CreatedAt,
            message: task.Status?.Message,
            error: task.Status?.Err,
        }));
    }),
);

app.get(
    '/services/:id/tasks',
    handleAsync(async (c) => {
        const serviceId = c.req.param('id');
        const tasks = await docker.listTasks({ filters: { service: [serviceId] } });
        return tasks.map((task: any) => ({
            id: task.ID,
            serviceId: task.ServiceID,
            nodeId: task.NodeID,
            status: task.Status?.State,
            desiredState: task.DesiredState,
            containerId: task.Status?.ContainerStatus?.ContainerID,
            createdAt: task.CreatedAt,
            message: task.Status?.Message,
            error: task.Status?.Err,
        }));
    }),
);

export default app;
