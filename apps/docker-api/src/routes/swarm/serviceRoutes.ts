import { Hono } from 'hono';
import type Dockerode from 'dockerode';
import { docker } from '@/utils/dockerClient';
import { route } from '@/helpers/route';
import { swarmStateManager } from '@/managers/swarmStateManager';
import {
    serviceIdParamSchema,
    scaleServiceSchema,
    createServiceSchema,
} from '@workspace/schemas-zod/docker/swarm/serviceAction.schema';

const app = new Hono();

app.post(
    '/',
    route({ json: createServiceSchema }, async (c) => {
        const {
            name,
            image,
            mode,
            replicas,
            ports,
            env,
            networks,
            constraints,
            labels,
            command,
            workDir,
            user,
            mounts,
            resourceLimits,
            resourceReservations,
            restartPolicy,
            updateConfig,
        } = c.req.valid('json');

        const containerSpec: Record<string, unknown> = {
            Image: image,
            ...(env && env.length > 0 ? { Env: env } : {}),
            ...(command && command.length > 0 ? { Command: command } : {}),
            ...(workDir ? { Dir: workDir } : {}),
            ...(user ? { User: user } : {}),
        };

        if (mounts && mounts.length > 0) {
            containerSpec['Mounts'] = mounts.map((m) => ({
                Type: m.type ?? 'bind',
                Source: m.source ?? '',
                Target: m.target,
                ReadOnly: m.readOnly ?? false,
            }));
        }

        const taskTemplate: Record<string, unknown> = {
            ContainerSpec: containerSpec,
        };

        if (resourceLimits || resourceReservations) {
            const resources: Record<string, unknown> = {};
            if (resourceLimits?.nanoCPUs || resourceLimits?.memoryBytes) {
                resources['Limits'] = {
                    ...(resourceLimits.nanoCPUs ? { NanoCPUs: resourceLimits.nanoCPUs } : {}),
                    ...(resourceLimits.memoryBytes ? { MemoryBytes: resourceLimits.memoryBytes } : {}),
                };
            }
            if (resourceReservations?.nanoCPUs || resourceReservations?.memoryBytes) {
                resources['Reservations'] = {
                    ...(resourceReservations.nanoCPUs ? { NanoCPUs: resourceReservations.nanoCPUs } : {}),
                    ...(resourceReservations.memoryBytes ? { MemoryBytes: resourceReservations.memoryBytes } : {}),
                };
            }
            taskTemplate['Resources'] = resources;
        }

        if (restartPolicy?.condition) {
            taskTemplate['RestartPolicy'] = {
                Condition: restartPolicy.condition,
                ...(restartPolicy.maxAttempts !== undefined ? { MaxAttempts: restartPolicy.maxAttempts } : {}),
            };
        }

        if (constraints && constraints.length > 0) {
            taskTemplate['Placement'] = { Constraints: constraints };
        }

        const serviceSpec: Record<string, unknown> = {
            Name: name,
            TaskTemplate: taskTemplate,
            Mode:
                mode === 'global'
                    ? { Global: {} }
                    : { Replicated: { Replicas: replicas ?? 1 } },
            ...(labels ? { Labels: labels } : {}),
        };

        if (networks && networks.length > 0) {
            serviceSpec['Networks'] = networks.map((n) => ({ Target: n }));
        }

        if (ports && ports.length > 0) {
            serviceSpec['EndpointSpec'] = {
                Ports: ports.map((p) => ({
                    Protocol: p.protocol ?? 'tcp',
                    TargetPort: p.target,
                    PublishedPort: p.published,
                    PublishMode: p.publishMode ?? 'ingress',
                })),
            };
        }

        if (updateConfig) {
            serviceSpec['UpdateConfig'] = {
                ...(updateConfig.parallelism !== undefined ? { Parallelism: updateConfig.parallelism } : {}),
                ...(updateConfig.delay !== undefined ? { Delay: updateConfig.delay } : {}),
                ...(updateConfig.failureAction ? { FailureAction: updateConfig.failureAction } : {}),
                ...(updateConfig.order ? { Order: updateConfig.order } : {}),
            };
        }

        const result = await docker.createService(serviceSpec as Dockerode.CreateServiceOptions);

        await swarmStateManager.hardRefresh();

        return { success: true, id: result.ID };
    }),
);

app.post(
    '/:id/scale',
    route({ param: serviceIdParamSchema, json: scaleServiceSchema }, async (c) => {
        const { id } = c.req.valid('param');
        const { replicas } = c.req.valid('json');

        const service = docker.getService(id);
        const serviceInfo = await service.inspect();

        await service.update({
            version: serviceInfo.Version.Index,
            ...serviceInfo.Spec,
            Mode: {
                ...serviceInfo.Spec.Mode,
                Replicated: {
                    Replicas: replicas,
                },
            },
        });

        await swarmStateManager.hardRefresh();

        return { success: true };
    }),
);

app.delete(
    '/:id',
    route({ param: serviceIdParamSchema }, async (c) => {
        const { id } = c.req.valid('param');

        const service = docker.getService(id);
        await service.remove();

        await swarmStateManager.hardRefresh();

        return { success: true };
    }),
);

export default app;
