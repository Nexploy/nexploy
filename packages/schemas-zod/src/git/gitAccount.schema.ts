import { z } from 'zod';

export const disconnectGitAccountSchema = z.object({
    gitProviderId: z.string(),
});

export const oauthConnectQuerySchema = z.object({
    gitProviderId: z.string().min(1),
});

export const oauthCallbackQuerySchema = z.object({
    code: z.string().optional(),
    state: z.string().optional(),
});
