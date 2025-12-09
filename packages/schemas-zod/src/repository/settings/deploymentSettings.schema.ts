import { z } from 'zod';

export const deploymentModeEnum = z.enum(['CONTAINER', 'SWARM']);
export const updateFailureActionEnum = z.enum(['CONTINUE', 'PAUSE', 'ROLLBACK']);
export const updateOrderEnum = z.enum(['STOP_FIRST', 'START_FIRST']);
export const rollbackFailureActionEnum = z.enum(['CONTINUE', 'PAUSE']);
export const restartConditionEnum = z.enum(['NONE', 'ON_FAILURE', 'ANY']);

const durationRegex = /^\d+[smh]$/;
const durationSchema = z.string().regex(durationRegex, 'Format invalide (ex: 10s, 5m, 1h)');

export const deploymentSettingsSchema = z.object({
    repositoryId: z.string(),
    deploymentMode: deploymentModeEnum,

    // Swarm configuration
    replicas: z.number().int().min(1).max(100),
    updateParallelism: z.number().int().min(1).max(100),
    updateDelay: durationSchema,
    updateFailureAction: updateFailureActionEnum,
    updateOrder: updateOrderEnum,
    rollbackParallelism: z.number().int().min(1).max(100),
    rollbackDelay: durationSchema,
    rollbackFailureAction: rollbackFailureActionEnum,

    // Restart policy
    restartCondition: restartConditionEnum,
    restartDelay: durationSchema,
    restartMaxAttempts: z.number().int().min(0).max(100),
    restartWindow: durationSchema,

    // Resources
    cpuLimit: z.number().min(0.1).max(128).nullable(),
    cpuReservation: z.number().min(0.1).max(128).nullable(),
    memoryLimit: z.string().nullable(),
    memoryReservation: z.string().nullable(),

    // Placement
    placementConstraints: z.array(z.string()),

    // Health check
    healthCheckEnabled: z.boolean(),
    healthCheckCommand: z.string().nullable(),
    healthCheckInterval: durationSchema,
    healthCheckTimeout: durationSchema,
    healthCheckRetries: z.number().int().min(1).max(10),
    healthCheckStartPeriod: durationSchema,
});

export type DeploymentSettingsForm = z.infer<typeof deploymentSettingsSchema>;
export type DeploymentMode = z.infer<typeof deploymentModeEnum>;
export type UpdateFailureAction = z.infer<typeof updateFailureActionEnum>;
export type UpdateOrder = z.infer<typeof updateOrderEnum>;
export type RollbackFailureAction = z.infer<typeof rollbackFailureActionEnum>;
export type RestartCondition = z.infer<typeof restartConditionEnum>;
