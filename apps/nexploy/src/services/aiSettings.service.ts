import { prisma } from '../../prisma/prisma';
import type { AISettingsUpdate } from '@workspace/typescript-interface/ai/aiSettings';

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
