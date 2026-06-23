import { prisma } from '../../prisma/prisma';
import type { AISettingsUpdate } from '@workspace/typescript-interface/ai/aiSettings';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';

export async function getAISettings() {
    const t = await getErrorTranslator();
    try {
        return await prisma.aISettings.upsert({
            where: { id: 'singleton' },
            create: { id: 'singleton' },
            update: {},
        });
    } catch (error: unknown) {
        throw new Error(t('aiSettings.getFailed'));
    }
}

export async function updateAISettingsPart(data: AISettingsUpdate): Promise<void> {
    const t = await getErrorTranslator();
    try {
        await prisma.aISettings.upsert({
            where: { id: 'singleton' },
            create: { id: 'singleton', ...data },
            update: data,
        });
    } catch (error: unknown) {
        throw new Error(t('aiSettings.updateFailed'));
    }
}
