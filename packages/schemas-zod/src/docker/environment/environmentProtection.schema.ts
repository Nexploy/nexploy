import { z } from 'zod';

export const environmentProtectedActions = [
    'container.create',
    'container.lifecycle',
    'container.update',
    'container.remove',
    'container.exec',
    'container.migrateIn',
    'container.migrateOut',
    'image.pull',
    'image.manage',
    'image.remove',
    'volume.manage',
    'volume.remove',
    'network.manage',
    'network.remove',
    'swarm.manage',
    'deployment.deploy',
    'maintenance.cleanup',
    'environment.update',
    'environment.delete',
] as const;

export const environmentProtectedActionSchema = z.enum(environmentProtectedActions);

export type EnvironmentProtectedAction = z.infer<typeof environmentProtectedActionSchema>;

export const environmentProtectionGroups = {
    container: [
        'container.create',
        'container.lifecycle',
        'container.update',
        'container.remove',
        'container.exec',
        'container.migrateIn',
        'container.migrateOut',
    ],
    image: ['image.pull', 'image.manage', 'image.remove'],
    volume: ['volume.manage', 'volume.remove'],
    network: ['network.manage', 'network.remove'],
    swarm: ['swarm.manage'],
    deployment: ['deployment.deploy'],
    maintenance: ['maintenance.cleanup'],
    environment: ['environment.update', 'environment.delete'],
} as const satisfies Record<string, readonly EnvironmentProtectedAction[]>;

export type EnvironmentProtectionGroup = keyof typeof environmentProtectionGroups;

export const environmentProtectionPresets = {
    readOnly: environmentProtectedActions,
    production: [
        'container.create',
        'container.remove',
        'container.exec',
        'container.migrateIn',
        'container.migrateOut',
        'image.remove',
        'volume.remove',
        'network.remove',
        'maintenance.cleanup',
        'environment.delete',
    ],
    noDataLoss: [
        'container.remove',
        'image.remove',
        'volume.remove',
        'network.remove',
        'maintenance.cleanup',
        'environment.delete',
    ],
} as const satisfies Record<string, readonly EnvironmentProtectedAction[]>;

export type EnvironmentProtectionPreset = keyof typeof environmentProtectionPresets;

export const environmentProtectionSchema = z.object({
    environmentId: z.cuid(),
    isProtected: z.boolean(),
    allowAdminBypass: z.boolean(),
    protectedActions: z.array(environmentProtectedActionSchema).max(environmentProtectedActions.length),
});

export type EnvironmentProtectionSchemaType = z.infer<typeof environmentProtectionSchema>;
