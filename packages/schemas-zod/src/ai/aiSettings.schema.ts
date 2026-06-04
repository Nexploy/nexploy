import { z } from 'zod';

export const updateAIGeneralSettingsSchema = z.object({
    aiEnabled: z.boolean(),
});

export const updateAIChatBehaviorSchema = z.object({
    requireDestructiveConfirmation: z.boolean(),
    maxSteps: z.number().min(1).max(20),
});

export const updateAIMcpPermissionsSchema = z.object({
    allowExecInContainer: z.boolean(),
    allowSwarmOperations: z.boolean(),
    allowImagesGroup: z.boolean(),
    allowVolumesGroup: z.boolean(),
    allowNetworksGroup: z.boolean(),
    allowComposeGroup: z.boolean(),
    allowRepositoriesGroup: z.boolean(),
    allowRegistriesGroup: z.boolean(),
    allowSslGroup: z.boolean(),
    allowEnvironmentsGroup: z.boolean(),
});

export const updateAICustomPromptSchema = z.object({
    customSystemPrompt: z.string().max(4000),
});

export const updateAISettingsSchema = z.object({
    requireDestructiveConfirmation: z.boolean(),
    aiEnabled: z.boolean(),
    customSystemPrompt: z.string().max(4000).nullable(),
    maxSteps: z.number().int().min(1).max(20),
    allowExecInContainer: z.boolean(),
    allowSwarmOperations: z.boolean(),
});
