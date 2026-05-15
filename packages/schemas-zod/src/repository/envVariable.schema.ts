import { z } from 'zod';

const envVariableItemSchema = (t: any) =>
    z.object({
        id: z.string().optional(),
        key: z.string().min(1, t('fieldRequired', { field: t('fieldNames.key') })),
        value: z.string(),
    });

export const envVariableSchema = (t: any) =>
    z.object({
        repositoryId: z.string(),
        envVariables: z.array(envVariableItemSchema(t)),
        deleteIds: z.array(z.string()),
    });
