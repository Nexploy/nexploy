import { prisma } from '../../prisma/prisma';
import type { AISettingsUpdate } from '@workspace/typescript-interface/ai/aiSettings';

export async function getAISettings() {
    try {
        return await prisma.aISettings.upsert({
            where: { id: 'singleton' },
            create: { id: 'singleton' },
            update: {},
        });
    } catch (error: unknown) {
        throw new Error('Failed to get AI settings');
    }
}

export async function updateAISettingsPart(data: AISettingsUpdate): Promise<void> {
    try {
        await prisma.aISettings.upsert({
            where: { id: 'singleton' },
            create: { id: 'singleton', ...data },
            update: data,
        });
    } catch (error: unknown) {
        throw new Error('Failed to update AI settings');
    }
}
