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
        const { name, image, mode, replicas, ports, env, networks, constraints, labels, command } =
            c.req.valid('json');

        const serviceSpec: Record<string, unknown> = {
            Name: name,
            TaskTemplate: {
                ContainerSpec: {
                    Image: image,
                    ...(env && env.length > 0 ? { Env: env } : {}),
                    ...(command && command.length > 0 ? { Command: command } : {}),
                },
            },
            Mode: mode === 'global'
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
                    PublishMode: 'ingress',
                })),
            };
        }

        if (constraints && constraints.length > 0) {
            (serviceSpec['TaskTemplate'] as Record<string, unknown>)['Placement'] = {
                Constraints: constraints,
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
