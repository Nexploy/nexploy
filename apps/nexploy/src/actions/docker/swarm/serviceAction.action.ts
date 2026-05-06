'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { kyDocker } from '@/lib/api/kyDocker';
import { HTTPError } from 'ky';
import { setToastServer } from '@/lib/toastServer';
import {
    createServiceFormSchema,
    scaleServiceSchema,
    serviceIdParamSchema,
} from '@workspace/schemas-zod/docker/swarm/serviceAction.schema';
import { z } from 'zod';

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

export const onCreateServiceAction = authActionServer
    .use(requirePermission('docker', 'manage'))
    .inputSchema(createServiceFormSchema)
    .action(async ({ parsedInput }) => {
        const {
            name,
            image,
            mode,
            replicas,
            ports,
            envVars,
            networks,
            labelsList,
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
        } = parsedInput;

        const env = envVars.filter((e) => e.key).map((e) => `${e.key}=${e.value}`);
        const labels = labelsList.filter((l) => l.key).length
            ? Object.fromEntries(labelsList.filter((l) => l.key).map((l) => [l.key, l.value]))
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

        const restartPolicy = restartCondition
            ? {
                  condition: restartCondition,
                  maxAttempts: restartMaxAttempts,
              }
            : undefined;

        const hasUpdateConfig =
            updateParallelism !== undefined ||
            updateDelay ||
            updateFailureAction ||
            updateOrder;

        const updateConfig = hasUpdateConfig
            ? {
                  parallelism: updateParallelism,
                  delay: updateDelay ? parseDelayToNanoseconds(updateDelay) : undefined,
                  failureAction: updateFailureAction,
                  order: updateOrder,
              }
            : undefined;

        try {
            return await kyDocker
                .post('swarm/services', {
                    json: {
                        name,
                        image,
                        mode,
                        replicas,
                        ports: ports.length ? ports : undefined,
                        env: env.length ? env : undefined,
                        networks: networks.filter(Boolean).length
                            ? networks.filter(Boolean)
                            : undefined,
                        labels,
                        constraints: constraints.filter(Boolean).length
                            ? constraints.filter(Boolean)
                            : undefined,
                        command: command?.trim() ? command.trim().split(/\s+/) : undefined,
                        workDir: workDir || undefined,
                        user: user || undefined,
                        mounts: mounts.filter((m) => m.target).length
                            ? mounts.filter((m) => m.target)
                            : undefined,
                        resourceLimits,
                        resourceReservations,
                        restartPolicy,
                        updateConfig,
                    },
                })
                .json<{ id: string }>();
        } catch (err: unknown) {
            if (err instanceof HTTPError) {
                await setToastServer({ type: 'error', message: err.message as string });
            }
        }
    });

export const onScaleServiceAction = authActionServer
    .use(requirePermission('docker', 'manage'))
    .inputSchema(z.object({ id: z.string(), replicas: z.number().int().min(0) }))
    .action(async ({ parsedInput: { id, replicas } }) => {
        try {
            return await kyDocker
                .post(`swarm/services/${id}/scale`, { json: { replicas } })
                .json();
        } catch (err: unknown) {
            if (err instanceof HTTPError) {
                await setToastServer({ type: 'error', message: err.message as string });
            }
        }
    });

export const onRemoveServiceAction = authActionServer
    .use(requirePermission('docker', 'manage'))
    .inputSchema(z.object({ id: z.string() }))
    .action(async ({ parsedInput: { id } }) => {
        try {
            return await kyDocker.delete(`swarm/services/${id}`).json();
        } catch (err: unknown) {
            if (err instanceof HTTPError) {
                await setToastServer({ type: 'error', message: err.message as string });
            }
        }
    });
