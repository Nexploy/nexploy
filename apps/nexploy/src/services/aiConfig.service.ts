import { prisma } from '../../prisma/prisma';
import { decrypt, encrypt } from '@/lib/encryption';
import type { Provider } from '@workspace/typescript-interface/ai/aiConfig';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';

export async function getProviderApiKey(provider: Provider): Promise<string | null> {
    const t = await getErrorTranslator();
    try {
        const row = await prisma.aIConfig.findFirst({ where: { providers: provider } });
        return row ? decrypt(row.apiKey) : null;
    } catch (error) {
        throw new Error(t('aiConfig.getKeyFailed'));
    }
}

export async function addProviderApiKey(provider: Provider, apiKey: string): Promise<void> {
    const t = await getErrorTranslator();
    try {
        const encrypted = encrypt(apiKey);
        const existing = await prisma.aIConfig.findFirst({ where: { providers: provider } });
        if (existing) {
            await prisma.aIConfig.update({
                where: { id: existing.id },
                data: { apiKey: encrypted },
            });
        } else {
            await prisma.aIConfig.create({ data: { providers: provider, apiKey: encrypted } });
        }
    } catch (error) {
        throw new Error(t('aiConfig.upsertKeyFailed'));
    }
}

export async function deleteProviderApiKey(provider: Provider): Promise<void> {
    const t = await getErrorTranslator();
    try {
        await prisma.aIConfig.deleteMany({ where: { providers: provider } });
    } catch (error) {
        throw new Error(t('aiConfig.deleteKeyFailed'));
    }
}

export async function getConfiguredProviders(): Promise<Provider[]> {
    const t = await getErrorTranslator();
    try {
        const rows = await prisma.aIConfig.findMany({ select: { providers: true } });
        return rows.map((r) => r.providers);
    } catch (error) {
        throw new Error(t('aiConfig.getProvidersFailed'));
    }
}

export async function getAllProviderKeyStatus(): Promise<Record<Provider, boolean>> {
    const t = await getErrorTranslator();
    try {
        const rows = await prisma.aIConfig.findMany({ select: { providers: true } });
        const result: Record<Provider, boolean> = {
            OPENAI: false,
            ANTHROPIC: false,
            GOOGLE: false,
            OPENROUTER: false,
            MISTRAL: false,
            GROQ: false,
            PERPLEXITY: false,
            GROK: false,
        };
        for (const row of rows) {
            result[row.providers] = true;
        }
        return result;
    } catch (error) {
        throw new Error(t('aiConfig.getKeyStatusFailed'));
    }
}
