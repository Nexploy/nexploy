import ky from 'ky';
import { NextResponse } from 'next/server';
import { authRouteServer, route } from '@/lib/api/nextRoute';
import { getProviderApiKey } from '@/services/aiConfig.service';
import type { ModelOption } from '@workspace/typescript-interface/ai/aiConfig';
import { providerParamSchema } from '@workspace/schemas-zod/api/params.schema';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';

async function fetchOpenAIModels(apiKey: string): Promise<ModelOption[]> {
    const json = await ky
        .get('https://api.openai.com/v1/models', {
            headers: { Authorization: `Bearer ${apiKey}` },
            next: { revalidate: 3600 },
        })
        .json<{ data: { id: string }[] }>();
    return json.data
        .filter(({ id }) => /^(gpt-|o1|o3|o4|chatgpt-)/.test(id) && !id.includes('instruct'))
        .sort((a, b) => a.id.localeCompare(b.id))
        .map(({ id }) => ({ value: id, label: id }));
}

async function fetchAnthropicModels(apiKey: string): Promise<ModelOption[]> {
    const json = await ky
        .get('https://api.anthropic.com/v1/models', {
            headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
            next: { revalidate: 3600 },
        })
        .json<{ data: { id: string; display_name: string }[] }>();
    return json.data.map(({ id, display_name }) => ({
        value: id,
        label: display_name,
    }));
}

async function fetchGoogleModels(apiKey: string): Promise<ModelOption[]> {
    const json = await ky
        .get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
            next: { revalidate: 3600 },
        })
        .json<{
            models: { name: string; displayName: string; supportedGenerationMethods: string[] }[];
        }>();
    return json.models
        .filter(
            (m) =>
                m.supportedGenerationMethods.includes('generateContent') &&
                m.name.includes('gemini'),
        )
        .map((m) => ({ value: m.name.replace('models/', ''), label: m.displayName }));
}

async function fetchOpenRouterModels(apiKey: string): Promise<ModelOption[]> {
    const json = await ky
        .get('https://openrouter.ai/api/v1/models', {
            headers: { Authorization: `Bearer ${apiKey}` },
            next: { revalidate: 3600 },
        })
        .json<{ data: { id: string; name: string }[] }>();
    return json.data.map(({ id, name }) => ({
        value: id,
        label: name,
    }));
}

async function fetchMistralModels(apiKey: string): Promise<ModelOption[]> {
    const json = await ky
        .get('https://api.mistral.ai/v1/models', {
            headers: { Authorization: `Bearer ${apiKey}` },
            next: { revalidate: 3600 },
        })
        .json<{ data: { id: string }[] }>();
    return json.data
        .filter(({ id }) => !id.includes('embed'))
        .sort((a, b) => a.id.localeCompare(b.id))
        .map(({ id }) => ({ value: id, label: id }));
}

async function fetchGroqModels(apiKey: string): Promise<ModelOption[]> {
    const json = await ky
        .get('https://api.groq.com/openai/v1/models', {
            headers: { Authorization: `Bearer ${apiKey}` },
            next: { revalidate: 3600 },
        })
        .json<{ data: { id: string }[] }>();
    return json.data.sort((a, b) => a.id.localeCompare(b.id)).map(({ id }) => ({ value: id, label: id }));
}

async function fetchPerplexityModels(apiKey: string): Promise<ModelOption[]> {
    const json = await ky
        .get('https://api.perplexity.ai/v1/models', {
            headers: { Authorization: `Bearer ${apiKey}` },
            next: { revalidate: 3600 },
        })
        .json<{ data: { id: string }[] }>();
    return json.data.sort((a, b) => a.id.localeCompare(b.id)).map(({ id }) => ({ value: id, label: id }));
}

async function fetchGrokModels(apiKey: string): Promise<ModelOption[]> {
    const json = await ky
        .get('https://api.x.ai/v1/models', {
            headers: { Authorization: `Bearer ${apiKey}` },
            next: { revalidate: 3600 },
        })
        .json<{ data: { id: string }[] }>();
    return json.data.sort((a, b) => a.id.localeCompare(b.id)).map(({ id }) => ({ value: id, label: id }));
}

export const GET = route
    .use(authRouteServer)
    .params(providerParamSchema)
    .handler(async (_req, { params }) => {
        const { provider } = params;

        const apiKey = await getProviderApiKey(provider);
        if (!apiKey) return NextResponse.json({ models: [] });

        try {
            let models: ModelOption[] = [];
            switch (provider) {
                case 'OPENAI':
                    models = await fetchOpenAIModels(apiKey);
                    break;
                case 'ANTHROPIC':
                    models = await fetchAnthropicModels(apiKey);
                    break;
                case 'GOOGLE':
                    models = await fetchGoogleModels(apiKey);
                    break;
                case 'OPENROUTER':
                    models = await fetchOpenRouterModels(apiKey);
                    break;
                case 'MISTRAL':
                    models = await fetchMistralModels(apiKey);
                    break;
                case 'GROQ':
                    models = await fetchGroqModels(apiKey);
                    break;
                case 'PERPLEXITY':
                    models = await fetchPerplexityModels(apiKey);
                    break;
                case 'GROK':
                    models = await fetchGrokModels(apiKey);
                    break;
                default: {
                    const t = await getErrorTranslator();
                    return NextResponse.json({ error: t('api.unknownProvider') }, { status: 400 });
                }
            }
            return NextResponse.json({ models });
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            return NextResponse.json({ error: message, models: [] }, { status: 502 });
        }
    });
