import { z } from 'zod';

export const createRegistrySchema = z.object({
    name: z.string().min(1),
    url: z.string().min(1),
    username: z.string().optional(),
    password: z.string().optional(),
});

export const updateRegistrySchema = z.object({
    id: z.string(),
    name: z.string().min(1),
    url: z.string().min(1),
    username: z.string().optional(),
    password: z.string().optional(),
});

export const deleteRegistrySchema = z.object({
    id: z.string(),
});

export type CreateRegistryInput = z.infer<typeof createRegistrySchema>;
export type UpdateRegistryInput = z.infer<typeof updateRegistrySchema>;
