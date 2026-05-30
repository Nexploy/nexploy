import { NextResponse } from 'next/server';
import { authRouteServer, route } from '@/lib/api/nextRoute';
import { getProviderApiKey } from '@/services/aiConfig.service';
import type { ModelOption } from '@workspace/typescript-interface/ai/aiConfig';

async function fetchOpenAIModels(apiKey: string): Promise<ModelOption[]> {
    const res = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${apiKey}` },
        next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`OpenAI: ${res.status}`);
    const json = await res.json();
    return (json.data as { id: string }[])
        .filter(({ id }) => /^(gpt-|o1|o3|o4|chatgpt-)/.test(id) && !id.includes('instruct'))
        .sort((a, b) => a.id.localeCompare(b.id))
        .map(({ id }) => ({ value: id, label: id }));
}

async function fetchAnthropicModels(apiKey: string): Promise<ModelOption[]> {
    const res = await fetch('https://api.anthropic.com/v1/models', {
        headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`Anthropic: ${res.status}`);
    const json = await res.json();
    return (json.data as { id: string; display_name: string }[]).map(({ id, display_name }) => ({
        value: id,
        label: display_name,
    }));
}

async function fetchGoogleModels(apiKey: string): Promise<ModelOption[]> {
    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
        { next: { revalidate: 3600 } },
    );
    if (!res.ok) throw new Error(`Google: ${res.status}`);
    const json = await res.json();
    return (
        json.models as { name: string; displayName: string; supportedGenerationMethods: string[] }[]
    )
        .filter(
            (m) =>
                m.supportedGenerationMethods.includes('generateContent') &&
                m.name.includes('gemini'),
        )
        .map((m) => ({ value: m.name.replace('models/', ''), label: m.displayName }));
}

async function fetchOpenRouterModels(apiKey: string): Promise<ModelOption[]> {
    const res = await fetch('https://openrouter.ai/api/v1/models', {
        headers: { Authorization: `Bearer ${apiKey}` },
        next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`OpenRouter: ${res.status}`);
    const json = await res.json();
    return (json.data as { id: string; name: string }[]).map(({ id, name }) => ({
        value: id,
        label: name,
    }));
}

export const GET = route.use(authRouteServer).handler(async (_req, { params }) => {
    const { provider } = await (params as Promise<{ provider: string }>);
    const providerUpper = provider.toUpperCase() as
        | 'OPENAI'
        | 'ANTHROPIC'
        | 'GOOGLE'
        | 'OPENROUTER';

    const apiKey = await getProviderApiKey(providerUpper);
    if (!apiKey) return NextResponse.json({ models: [] });

    try {
        let models: ModelOption[] = [];
        switch (provider) {
            case 'openai':
                models = await fetchOpenAIModels(apiKey);
                break;
            case 'anthropic':
                models = await fetchAnthropicModels(apiKey);
                break;
            case 'google':
                models = await fetchGoogleModels(apiKey);
                break;
            case 'openrouter':
                models = await fetchOpenRouterModels(apiKey);
                break;
            default:
                return NextResponse.json({ error: 'Unknown provider' }, { status: 400 });
        }
        return NextResponse.json({ models });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: message, models: [] }, { status: 502 });
    }
});
