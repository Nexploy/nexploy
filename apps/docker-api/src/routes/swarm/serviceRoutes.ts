import { Hono } from 'hono';
import { docker } from '@/utils/dockerClient';
import { handleAsync } from '@/helpers/handleAsync';
import { swarmStateManager } from '@/managers/swarmStateManager';
import { getTranslations } from '@/middleware/locale.middleware';

const app = new Hono();

app.get(
    '/',
    handleAsync(async () => {
        return { services: swarmStateManager.getAllServices() };
    }),
);

app.get(
    '/:id',
    handleAsync(async (c) => {
        const serviceId = c.req.param('id');
        const service = swarmStateManager.getService(serviceId);

        if (!service) {
            const t = getTranslations(c, 'docker');
            return c.json({ error: t('errors.serviceNotFound') }, 404);
        }

        const tasks = swarmStateManager.getTasksByService(serviceId);
        return { service, tasks };
    }),
);

app.post(
    '/',
    handleAsync(async (c) => {
        const {
            name,
            image,
            replicas = 1,
            mode = 'replicated',
            ports = [],
            env = [],
            labels = {},
            networks = [],
            constraints = [],
            resources,
            mounts = [],
            command,
            args,
            healthCheck,
            updateConfig,
        } = await c.req.json();

        if (!name || !image) {
            const t = getTranslations(c, 'docker');
            return c.json({ error: t('errors.nameAndImageRequired') }, 400);
        }

        const portConfigs = ports.map((p: any) => ({
            Protocol: p.protocol || 'tcp',
            TargetPort: p.targetPort,
            PublishedPort: p.publishedPort,
            PublishMode: p.publishMode || 'ingress',
        }));

        const mountConfigs = mounts.map((m: any) => ({
            Type: m.type || 'volume',
            Source: m.source,
            Target: m.target,
            ReadOnly: m.readOnly || false,
        }));

        const serviceSpec: any = {
            Name: name,
            Labels: labels,
            TaskTemplate: {
                ContainerSpec: {
                    Image: image,
                    Env: env,
                    Command: command,
                    Args: args,
                    Mounts: mountConfigs.length > 0 ? mountConfigs : undefined,
                    Healthcheck: healthCheck
                        ? {
                              Test: healthCheck.test,
                              Interval: healthCheck.interval,
                              Timeout: healthCheck.timeout,
                              Retries: healthCheck.retries,
                              StartPeriod: healthCheck.startPeriod,
                          }
                        : undefined,
                },
                Placement: constraints.length > 0 ? { Constraints: constraints } : undefined,
                Resources: resources
                    ? {
                          Limits: resources.limits
                              ? {
                                    NanoCPUs: resources.limits.cpus
                                        ? Math.floor(resources.limits.cpus * 1e9)
                                        : undefined,
                                    MemoryBytes: resources.limits.memory,
                                }
                              : undefined,
                          Reservations: resources.reservations
                              ? {
                                    NanoCPUs: resources.reservations.cpus
                                        ? Math.floor(resources.reservations.cpus * 1e9)
                                        : undefined,
                                    MemoryBytes: resources.reservations.memory,
                                }
                              : undefined,
                      }
                    : undefined,
            },
            Mode: mode === 'global' ? { Global: {} } : { Replicated: { Replicas: replicas } },
            EndpointSpec: portConfigs.length > 0 ? { Ports: portConfigs } : undefined,
            Networks:
                networks.length > 0 ? networks.map((n: string) => ({ Target: n })) : undefined,
            UpdateConfig: updateConfig
                ? {
                      Parallelism: updateConfig.parallelism || 1,
                      Delay: updateConfig.delay || 0,
                      FailureAction: updateConfig.failureAction || 'pause',
                      Order: updateConfig.order || 'stop-first',
                  }
                : undefined,
        };

        const result = await docker.createService(serviceSpec);

        await swarmStateManager.hardRefresh();
        const service = swarmStateManager.getService(result.id);

        return {
            success: true,
            serviceId: result.id,
            service,
        };
    }),
);

app.patch(
    '/:id',
    handleAsync(async (c) => {
        const serviceId = c.req.param('id');
        const updates = await c.req.json();

        const service = docker.getService(serviceId);
        const serviceInfo = await service.inspect();

        const newSpec: any = { ...serviceInfo.Spec };

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

        if (updates.ports) {
            newSpec.EndpointSpec = {
                Ports: updates.ports.map((p: any) => ({
                    Protocol: p.protocol || 'tcp',
                    TargetPort: p.targetPort,
                    PublishedPort: p.publishedPort,
                    PublishMode: p.publishMode || 'ingress',
                })),
            };
        }

        if (updates.constraints) {
            newSpec.TaskTemplate.Placement = { Constraints: updates.constraints };
        }

        if (updates.resources) {
            newSpec.TaskTemplate.Resources = {
                Limits: updates.resources.limits
                    ? {
                          NanoCPUs: updates.resources.limits.cpus
                              ? Math.floor(updates.resources.limits.cpus * 1e9)
                              : undefined,
                          MemoryBytes: updates.resources.limits.memory,
                      }
                    : undefined,
                Reservations: updates.resources.reservations
                    ? {
                          NanoCPUs: updates.resources.reservations.cpus
                              ? Math.floor(updates.resources.reservations.cpus * 1e9)
                              : undefined,
                          MemoryBytes: updates.resources.reservations.memory,
                      }
                    : undefined,
            };
        }

        const updateOpts: any = {
            version: serviceInfo.Version.Index,
            ...newSpec,
        };

        if (updates.forceUpdate) {
            updateOpts.TaskTemplate.ForceUpdate =
                (serviceInfo.Spec.TaskTemplate.ForceUpdate || 0) + 1;
        }

        await service.update(updateOpts);

        await swarmStateManager.hardRefresh();
        const updatedService = swarmStateManager.getService(serviceId);

        return { success: true, service: updatedService };
    }),
);

app.delete(
    '/:id',
    handleAsync(async (c) => {
        const serviceId = c.req.param('id');

        const service = docker.getService(serviceId);
        await service.remove();

        return { success: true, serviceId };
    }),
);

app.post(
    '/:id/scale',
    handleAsync(async (c) => {
        const serviceId = c.req.param('id');
        const { replicas } = await c.req.json();

        if (typeof replicas !== 'number' || replicas < 0) {
            const t = getTranslations(c, 'docker');
            return c.json({ error: t('errors.invalidReplicasCount') }, 400);
        }

        const service = docker.getService(serviceId);
        const serviceInfo = await service.inspect();

        if (!serviceInfo.Spec.Mode.Replicated) {
            const t = getTranslations(c, 'docker');
            return c.json({ error: t('errors.cannotScaleGlobalService') }, 400);
        }

        await service.update({
            version: serviceInfo.Version.Index,
            ...serviceInfo.Spec,
            Mode: {
                Replicated: { Replicas: replicas },
            },
        });

        await swarmStateManager.hardRefresh();
        const updatedService = swarmStateManager.getService(serviceId);

        return { success: true, service: updatedService };
    }),
);

app.post(
    '/:id/rollback',
    handleAsync(async (c) => {
        const serviceId = c.req.param('id');

        const service = docker.getService(serviceId);
        const serviceInfo = await service.inspect();

        if (!serviceInfo.PreviousSpec) {
            const t = getTranslations(c, 'docker');
            return c.json({ error: t('errors.noPreviousVersion') }, 400);
        }

        await service.update({
            version: serviceInfo.Version.Index,
            ...serviceInfo.PreviousSpec,
        });

        await swarmStateManager.hardRefresh();
        const updatedService = swarmStateManager.getService(serviceId);

        return { success: true, service: updatedService };
    }),
);

app.post(
    '/:id/force-update',
    handleAsync(async (c) => {
        const serviceId = c.req.param('id');

        const service = docker.getService(serviceId);
        const serviceInfo = await service.inspect();

        const newSpec = { ...serviceInfo.Spec };
        newSpec.TaskTemplate.ForceUpdate = (serviceInfo.Spec.TaskTemplate.ForceUpdate || 0) + 1;

        await service.update({
            version: serviceInfo.Version.Index,
            ...newSpec,
        });

        await swarmStateManager.hardRefresh();
        const updatedService = swarmStateManager.getService(serviceId);

        return { success: true, service: updatedService };
    }),
);

app.get(
    '/:id/logs',
    handleAsync(async (c) => {
        const serviceId = c.req.param('id');
        const tail = c.req.query('tail') || '100';
        const timestamps = c.req.query('timestamps') === 'true';

        const service = docker.getService(serviceId);
        const logs = await service.logs({
            stdout: true,
            stderr: true,
            tail: parseInt(tail),
            timestamps,
        });

        return { logs: logs.toString() };
    }),
);

export default app;
