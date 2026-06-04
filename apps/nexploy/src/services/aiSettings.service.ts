import { prisma } from '../../prisma/prisma';

type AISettingsUpdate = {
    aiEnabled?: boolean;
    requireDestructiveConfirmation?: boolean;
    maxSteps?: number;
    allowExecInContainer?: boolean;
    allowSwarmOperations?: boolean;
    customSystemPrompt?: string | null;
};

export async function getAISettings() {
    return prisma.aISettings.upsert({
        where: { id: 'singleton' },
        create: { id: 'singleton' },
        update: {},
    });
}

export async function updateAISettingsPart(data: AISettingsUpdate): Promise<void> {
    await prisma.aISettings.upsert({
        where: { id: 'singleton' },
        create: { id: 'singleton', ...data },
        update: data,
    });
}

/** @deprecated use updateAISettingsPart */
export async function updateAISettings(data: AISettingsUpdate): Promise<void> {
    await updateAISettingsPart(data);
}
