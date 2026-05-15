import { z } from 'zod';

export const createRegistrySchema = (t: any) =>
    z.object({
        name: z.string().min(1, t('fieldRequired', { field: t('fieldNames.name') })),
        url: z.string().min(1, t('fieldRequired', { field: t('fieldNames.url') })),
        username: z.string().optional(),
        password: z.string().optional(),
    });

export const updateRegistrySchema = (t: any) =>
    z.object({
        id: z.string(),
        name: z.string().min(1, t('fieldRequired', { field: t('fieldNames.name') })),
        url: z.string().min(1, t('fieldRequired', { field: t('fieldNames.url') })),
        username: z.string().optional(),
        password: z.string().optional(),
    });

export const deleteRegistrySchema = z.object({
    id: z.string(),
});

export type CreateRegistryInput = z.infer<ReturnType<typeof createRegistrySchema>>;
export type UpdateRegistryInput = z.infer<ReturnType<typeof updateRegistrySchema>>;
