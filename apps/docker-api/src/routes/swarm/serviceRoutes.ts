import { Hono } from 'hono';
import { docker } from '@/utils/dockerClient';
import { handleAsync } from '@/helpers/handleAsync';
import { swarmStateManager } from '@/managers/swarmStateManager';
import { zValidator } from '@hono/zod-validator';
import {
    serviceIdParamSchema,
    scaleServiceSchema,
    createServiceSchema,
} from '@workspace/schemas-zod/docker/swarm/serviceAction.schema';
import { getValidatedJson, getValidatedParam } from '@/helpers/validation';

const app = new Hono();

app.post(
    '/',
    zValidator('json', createServiceSchema),
    handleAsync(async (c) => {
        const { name, image, replicas, ports, env, networks, constraints, labels, command } =
            getValidatedJson(c, createServiceSchema);

        const serviceSpec: Record<string, unknown> = {
            Name: name,
            TaskTemplate: {
                ContainerSpec: {
                    Image: image,
                    ...(env && env.length > 0 ? { Env: env } : {}),
                    ...(command && command.length > 0 ? { Command: command } : {}),
                },
            },
            Mode: {
                Replicated: {
                    Replicas: replicas ?? 1,
                },
            },
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

        const result = await docker.createService(serviceSpec as Parameters<typeof docker.createService>[0]);

        await swarmStateManager.hardRefresh();

        return { success: true, id: result.id };
    }),
);

app.post(
    '/:id/scale',
    zValidator('param', serviceIdParamSchema),
    zValidator('json', scaleServiceSchema),
    handleAsync(async (c) => {
        const { id } = getValidatedParam(c, serviceIdParamSchema);
        const { replicas } = getValidatedJson(c, scaleServiceSchema);

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
    zValidator('param', serviceIdParamSchema),
    handleAsync(async (c) => {
        const { id } = getValidatedParam(c, serviceIdParamSchema);

        const service = docker.getService(id);
        await service.remove();

        await swarmStateManager.hardRefresh();

        return { success: true };
    }),
);

export default app;
