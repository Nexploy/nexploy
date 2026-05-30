/** Prisma enum values */
export type Provider = 'OPENAI' | 'ANTHROPIC' | 'GOOGLE' | 'OPENROUTER';

/** Lowercase alias used in URL params and chat body */
export type AIProvider = 'openai' | 'anthropic' | 'google' | 'openrouter';

export interface AIConfigRow {
    id: string;
    providers: Provider;
    apiKey: string | null; // decrypted
    createdAt: Date;
    updatedAt: Date;
}

export interface ModelOption {
    value: string;
    label: string;
}

export interface SelectedModel {
    provider: AIProvider;
    modelId: string;
    label: string;
}

export type Capability = 'vision' | 'tools' | 'fast' | 'web';

export function toProvider(param: AIProvider): Provider {
    return param.toUpperCase() as Provider;
}

export function toAIProvider(provider: Provider): AIProvider {
    return provider.toLowerCase() as AIProvider;
}
