export type Provider =
    | 'OPENAI'
    | 'ANTHROPIC'
    | 'GOOGLE'
    | 'OPENROUTER'
    | 'MISTRAL'
    | 'GROQ'
    | 'PERPLEXITY'
    | 'GROK';

export interface ProviderCardConfig {
    provider: Provider;
    label: string;
    color: string;
    icon: {
        fileName: string;
        className?: string;
    };
    hasKey: boolean;
    keyUrl: string;
}

export interface ModelOption {
    value: string;
    label: string;
}

export interface SelectedModel {
    provider: Provider;
    modelId: string;
    label: string;
}
