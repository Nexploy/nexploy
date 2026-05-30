import { prisma } from '../../prisma/prisma';
import { decrypt, encrypt } from '@/lib/encryption';
import type { Provider } from '@workspace/typescript-interface/ai/aiConfig';

export async function getProviderApiKey(provider: Provider): Promise<string | null> {
    try {
        const row = await prisma.aIConfig.findFirst({ where: { providers: provider } });
        return row ? decrypt(row.apiKey) : null;
    } catch (error) {
        throw new Error('Failed to get provider API key');
    }
}

export async function addProviderApiKey(provider: Provider, apiKey: string): Promise<void> {
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
        throw new Error('Failed to upsert provider API key');
    }
}

export async function deleteProviderApiKey(provider: Provider): Promise<void> {
    try {
        await prisma.aIConfig.deleteMany({ where: { providers: provider } });
    } catch (error) {
        throw new Error('Failed to delete provider API key');
    }
}

export async function getConfiguredProviders(): Promise<Provider[]> {
    try {
        const rows = await prisma.aIConfig.findMany({ select: { providers: true } });
        return rows.map((r) => r.providers);
    } catch (error) {
        throw new Error('Failed to get configured providers');
    }
}

export async function getAllProviderKeyStatus(): Promise<Record<Provider, boolean>> {
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
        throw new Error('Failed to get all provider key status');
    }
}
