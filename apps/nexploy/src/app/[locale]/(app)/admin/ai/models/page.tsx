import { Cpu } from 'lucide-react';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { getAllProviderKeyStatus } from '@/services/aiConfig.service';
import { ModelProviderCard } from '@/components/admin/ai/models/ModelProviderCard';
import type { ProviderCardConfig } from '@workspace/typescript-interface/ai/aiConfig';
import Openai from '@thesvg/react/openai';
import Anthropic from '@thesvg/react/anthropic';
import Gemini from '@thesvg/react/gemini';
import Openrouter from '@thesvg/react/openrouter';
import Groq from '@thesvg/react/groq';
import Perplexity from '@thesvg/react/perplexity';
import { Grok, Mistral } from '@thesvg/react';

export const metadata: Metadata = {
    title: 'AI Models',
    description: 'Configure AI provider API keys',
};

export default async function AIModelsPage() {
    const [t, keyStatus] = await Promise.all([
        getTranslations('ai.admin.models'),
        getAllProviderKeyStatus(),
    ]);

    const providers: ProviderCardConfig[] = [
        {
            provider: 'OPENROUTER',
            label: 'OpenRouter',
            color: 'bg-gray-500',
            icon: <Openrouter className="size-6 shrink-0" />,
            hasKey: keyStatus.OPENROUTER,
            keyUrl: 'https://openrouter.ai/settings/keys',
        },
        {
            provider: 'OPENAI',
            label: 'OpenAI',
            color: 'bg-[#10A37F]',
            icon: <Openai className="size-6 shrink-0" />,
            hasKey: keyStatus.OPENAI,
            keyUrl: 'https://platform.openai.com/api-keys',
        },
        {
            provider: 'ANTHROPIC',
            label: 'Anthropic',
            color: 'bg-[#D97757]',
            icon: <Anthropic className="size-6 shrink-0" />,
            hasKey: keyStatus.ANTHROPIC,
            keyUrl: 'https://console.anthropic.com/settings/keys',
        },
        {
            provider: 'GOOGLE',
            label: 'Google',
            color: 'bg-white',
            icon: <Gemini className="size-6 shrink-0" />,
            hasKey: keyStatus.GOOGLE,
            keyUrl: 'https://aistudio.google.com/app/apikey',
        },
        {
            provider: 'MISTRAL',
            label: 'Mistral AI',
            color: 'bg-[#FF7000]',
            icon: <Mistral className="size-6 shrink-0" />,
            hasKey: keyStatus.MISTRAL,
            keyUrl: 'https://console.mistral.ai/api-keys',
        },
        {
            provider: 'GROQ',
            label: 'Groq',
            color: 'bg-[#F55036]',
            icon: <Groq className="size-6 shrink-0" />,
            hasKey: keyStatus.GROQ,
            keyUrl: 'https://console.groq.com/keys',
        },
        {
            provider: 'PERPLEXITY',
            label: 'Perplexity',
            color: 'bg-[#1A6570]',
            icon: <Perplexity className="size-6 shrink-0" />,
            hasKey: keyStatus.PERPLEXITY,
            keyUrl: 'https://www.perplexity.ai/settings/api',
        },
        {
            provider: 'GROK',
            label: 'Grok (xAI)',
            color: 'bg-zinc-900',
            icon: <Grok className="size-6 shrink-0" />,
            hasKey: keyStatus.GROK,
            keyUrl: 'https://console.x.ai/',
        },
    ];

    return (
        <div className="flex h-full flex-1 flex-col">
            <div className="flex flex-col gap-4 overflow-hidden">
                <div className="flex gap-3 px-5">
                    <div className="bg-primary/10 mt-5 flex size-12 shrink-0 items-center justify-center rounded-lg">
                        <Cpu className="text-primary size-7" />
                    </div>
                    <div className="mt-3.5 flex flex-col">
                        <h1 className="text-3xl font-semibold tracking-tight break-all">
                            {t('title')}
                        </h1>
                        <p className="text-muted-foreground text-sm">{t('description')}</p>
                    </div>
                </div>

                <ScrollAreaWithShadow className="h-full overflow-hidden">
                    <div className="grid grid-cols-1 items-start gap-3 px-5 pb-5 lg:grid-cols-2">
                        {providers.map((provider) => (
                            <ModelProviderCard {...provider} key={provider.provider} />
                        ))}
                    </div>
                </ScrollAreaWithShadow>
            </div>
        </div>
    );
}
