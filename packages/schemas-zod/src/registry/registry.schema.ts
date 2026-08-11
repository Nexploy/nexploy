import { z } from 'zod';

const normalizeRegistryUrl = (raw: string): string =>
    raw
        .trim()
        .replace(/^https?:\/\//i, '')
        .replace(/\/+$/, '');

const registryUrl = z
    .string()
    .min(1, 'URL is required')
    .transform(normalizeRegistryUrl)
    .pipe(z.string().min(1, 'URL is required'));

export const createRegistrySchema = z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name must be at most 100 characters'),
    url: registryUrl,
    username: z.string().optional(),
    password: z.string().optional(),
});

export const updateRegistrySchema = z.object({
    id: z.string(),
    name: z.string().min(1, 'Name is required').max(100, 'Name must be at most 100 characters'),
    url: registryUrl,
    username: z.string().optional(),
    password: z.string().optional(),
});

export const deleteRegistrySchema = z.object({
    id: z.string(),
});

export const LOCAL_REGISTRY_IMAGE = 'registry:3';
export const LOCAL_REGISTRY_CONTAINER_PORT = 5000;
export const LOCAL_REGISTRY_CONTAINER_DATA_PATH = '/var/lib/registry';

const normalizeRegistryHost = (raw: string): string =>
    raw
        .trim()
        .replace(/^https?:\/\//i, '')
        .replace(/\/.*$/, '')
        .replace(/:\d+$/, '');

const registryHost = z
    .string()
    .min(1, 'Host is required')
    .transform(normalizeRegistryHost)
    .pipe(z.string().min(1, 'Host is required'));

const absoluteHostPath = z
    .string()
    .min(1, 'Storage path is required')
    .refine((value) => value.startsWith('/'), 'Storage path must be absolute')
    .refine((value) => !value.includes('..'), 'Storage path must not contain ".."');

export const createLocalRegistrySchema = z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name must be at most 100 characters'),
    containerName: z
        .string()
        .min(1, 'Container name is required')
        .max(64, 'Container name must be at most 64 characters')
        .regex(/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/, 'Container name contains invalid characters'),
    host: registryHost,
    port: z.coerce.number().min(1, 'Port must be between 1 and 65535').max(65535, 'Port must be between 1 and 65535'),
    dataPath: absoluteHostPath,
});

export type CreateRegistryInput = z.infer<typeof createRegistrySchema>;
export type UpdateRegistryInput = z.infer<typeof updateRegistrySchema>;
export type CreateLocalRegistryInput = z.infer<typeof createLocalRegistrySchema>;
