import { Hono } from 'hono';
import { docker } from '@/utils/dockerClient';
import { route } from '@/utils/route';
import {
    createServiceFormSchema,
    removeServicesSchema,
    scaleServiceSchema,
    serviceIdParamSchema,
} from '@workspace/schemas-zod/docker/swarm/serviceAction.schema';

const app = new Hono();

function parseDelayToNanoseconds(delay: string): number {
    const match = delay.trim().match(/^(\d+(?:\.\d+)?)(ns|us|ms|s|m|h)$/);
    if (!match) return 0;
    const value = parseFloat(match[1]!);
    const unit = match[2]!;
    const multipliers: Record<string, number> = {
        ns: 1,
        us: 1_000,
        ms: 1_000_000,
        s: 1_000_000_000,
        m: 60_000_000_000,
        h: 3_600_000_000_000,
    };
    return Math.round(value * (multipliers[unit] ?? 0));
}

app.post(
    '/',
    route({ json: createServiceFormSchema }, async (c) => {
        const {
            name,
            image,
            mode,
            replicas,
            ports,
            envVars,
            networks,
            labels,
            constraints,
            command,
            workDir,
            user,
            mounts,
            cpuLimit,
            memoryLimit,
            cpuReservation,
            memoryReservation,
            restartCondition,
            restartMaxAttempts,
            updateParallelism,
            updateDelay,
            updateFailureAction,
            updateOrder,
        } = c.req.valid('json');

        const env = envVars.filter((e) => e.key).map((e) => `${e.key}=${e.value}`);
        const labelsRecord = labels.length
            ? Object.fromEntries(labels.map((l) => [l.key, l.value]))
            : undefined;

        const resourceLimits =
            cpuLimit || memoryLimit
                ? {
                      nanoCPUs: cpuLimit ? Math.round(parseFloat(cpuLimit) * 1e9) : undefined,
                      memoryBytes: memoryLimit
                          ? parseInt(memoryLimit, 10) * 1024 * 1024
                          : undefined,
                  }
                : undefined;

        const resourceReservations =
            cpuReservation || memoryReservation
                ? {
                      nanoCPUs: cpuReservation
                          ? Math.round(parseFloat(cpuReservation) * 1e9)
                          : undefined,
                      memoryBytes: memoryReservation
                          ? parseInt(memoryReservation, 10) * 1024 * 1024
                          : undefined,
                  }
                : undefined;

        const containerSpec: Record<string, unknown> = {
            Image: image,
            ...(env.length > 0 ? { Env: env } : {}),
            ...(command?.trim() ? { Command: command.trim().split(/\s+/) } : {}),
            ...(workDir ? { Dir: workDir } : {}),
            ...(user ? { User: user } : {}),
        };

        const filteredMounts = mounts.filter((m) => m.target);
        if (filteredMounts.length > 0) {
            containerSpec['Mounts'] = filteredMounts.map((m) => ({
                Type: m.type,
                Source: m.source ?? '',
                Target: m.target,
                ReadOnly: m.readOnly,
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
                    ...(resourceLimits.memoryBytes
                        ? { MemoryBytes: resourceLimits.memoryBytes }
                        : {}),
                };
            }
            if (resourceReservations?.nanoCPUs || resourceReservations?.memoryBytes) {
                resources['Reservations'] = {
                    ...(resourceReservations.nanoCPUs
                        ? { NanoCPUs: resourceReservations.nanoCPUs }
                        : {}),
                    ...(resourceReservations.memoryBytes
                        ? { MemoryBytes: resourceReservations.memoryBytes }
                        : {}),
                };
            }
            taskTemplate['Resources'] = resources;
        }

        if (restartCondition) {
            taskTemplate['RestartPolicy'] = {
                Condition: restartCondition,
                ...(restartMaxAttempts !== undefined
                    ? { MaxAttempts: restartMaxAttempts }
                    : {}),
            };
        }

        const filteredConstraints = constraints.filter(Boolean);
        if (filteredConstraints.length > 0) {
            taskTemplate['Placement'] = { Constraints: filteredConstraints };
        }

        const hasUpdateConfig =
            updateParallelism !== undefined || updateDelay || updateFailureAction || updateOrder;

        const serviceSpec: Record<string, unknown> = {
            Name: name,
            TaskTemplate: taskTemplate,
            Mode: mode === 'global' ? { Global: {} } : { Replicated: { Replicas: replicas } },
            ...(labelsRecord ? { Labels: labelsRecord } : {}),
        };

        const filteredNetworks = networks.filter(Boolean);
        if (filteredNetworks.length > 0) {
            serviceSpec['Networks'] = filteredNetworks.map((n) => ({ Target: n }));
        }

        if (ports.length > 0) {
            serviceSpec['EndpointSpec'] = {
                Ports: ports.map((p) => ({
                    Protocol: p.protocol,
                    TargetPort: p.target,
                    PublishedPort: p.published,
                    PublishMode: p.publishMode,
                })),
            };
        }

        if (hasUpdateConfig) {
            serviceSpec['UpdateConfig'] = {
                ...(updateParallelism !== undefined ? { Parallelism: updateParallelism } : {}),
                ...(updateDelay ? { Delay: parseDelayToNanoseconds(updateDelay) } : {}),
                ...(updateFailureAction ? { FailureAction: updateFailureAction } : {}),
                ...(updateOrder ? { Order: updateOrder } : {}),
            };
        }

        const result = await docker.createService(serviceSpec);

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

        return { success: true };
    }),
);

app.delete(
    '/:id',
    route({ param: serviceIdParamSchema }, async (c) => {
        const { id } = c.req.valid('param');

        const service = docker.getService(id);
        await service.remove();

        return { success: true };
    }),
);

app.delete(
    '/',
    route({ json: removeServicesSchema }, async (c) => {
        const { serviceIds } = c.req.valid('json');

        await Promise.all(serviceIds.map((id) => docker.getService(id).remove()));

        return { success: true };
    }),
);

export default app;
