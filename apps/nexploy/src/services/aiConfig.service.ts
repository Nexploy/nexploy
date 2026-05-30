import { prisma } from '../../prisma/prisma';
import { decrypt, encrypt } from '@/lib/encryption';
import type { AIProvider, Provider } from '@workspace/typescript-interface/ai/aiConfig';

export async function getProviderApiKey(provider: Provider | AIProvider): Promise<string | null> {
    const p = provider.toUpperCase() as Provider;
    const row = await prisma.aIConfig.findFirst({ where: { providers: p } });
    return row ? decrypt(row.apiKey) : null;
}

export async function upsertProviderApiKey(
    provider: Provider,
    apiKey: string | null,
): Promise<void> {
    if (!apiKey) {
        await prisma.aIConfig.deleteMany({ where: { providers: provider } });
        return;
    }
    const encrypted = encrypt(apiKey);
    const existing = await prisma.aIConfig.findFirst({ where: { providers: provider } });
    if (existing) {
        await prisma.aIConfig.update({ where: { id: existing.id }, data: { apiKey: encrypted } });
    } else {
        await prisma.aIConfig.create({ data: { providers: provider, apiKey: encrypted } });
    }
}

export async function getAllProviderKeys(): Promise<Record<Provider, string | null>> {
    const rows = await prisma.aIConfig.findMany();
    const result: Record<Provider, string | null> = {
        OPENAI: null,
        ANTHROPIC: null,
        GOOGLE: null,
        OPENROUTER: null,
    };
    for (const row of rows) {
        result[row.providers] = decrypt(row.apiKey);
    }
    return result;
}
