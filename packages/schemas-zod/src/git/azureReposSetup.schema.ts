import { z } from 'zod';

export const azureReposSetupSchema = z.object({
    displayName: z.string().min(1, 'Display name is required'),
    clientId: z.string().min(1, 'Application (client) ID is required'),
    clientSecret: z.string().min(1, 'Client secret is required'),
    tenantId: z.string().optional(),
});

export type AzureReposSetup = z.infer<typeof azureReposSetupSchema>;
