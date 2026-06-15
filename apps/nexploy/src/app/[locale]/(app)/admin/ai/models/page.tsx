import { Cpu } from 'lucide-react';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { getAllProviderKeyStatus } from '@/services/aiConfig.service';
import { ModelProviderCard } from '@/components/admin/ai/models/ModelProviderCard';
import type { Provider, ProviderCardConfig } from '@workspace/typescript-interface/ai/aiConfig';
import { PROVIDER_META } from '@/components/ai/providerMeta';

export const metadata: Metadata = {
    title: 'AI Models',
    description: 'Configure AI provider API keys',
};

const PROVIDER_DEFS: { provider: Provider; label: string; keyUrl: string }[] = [
    { provider: 'OPENROUTER', label: 'OpenRouter', keyUrl: 'https://openrouter.ai/settings/keys' },
    { provider: 'OPENAI', label: 'OpenAI', keyUrl: 'https://platform.openai.com/api-keys' },
    {
        provider: 'ANTHROPIC',
        label: 'Anthropic',
        keyUrl: 'https://console.anthropic.com/settings/keys',
    },
    { provider: 'GOOGLE', label: 'Google', keyUrl: 'https://aistudio.google.com/app/apikey' },
    { provider: 'MISTRAL', label: 'Mistral AI', keyUrl: 'https://console.mistral.ai/api-keys' },
    { provider: 'GROQ', label: 'Groq', keyUrl: 'https://console.groq.com/keys' },
    { provider: 'PERPLEXITY', label: 'Perplexity', keyUrl: 'https://www.perplexity.ai/settings/api' },
    { provider: 'GROK', label: 'Grok (xAI)', keyUrl: 'https://console.x.ai/' },
];

export default async function AIModelsPage() {
    const [t, keyStatus] = await Promise.all([
        getTranslations('ai.admin.models'),
        getAllProviderKeyStatus(),
    ]);

    const providers: ProviderCardConfig[] = PROVIDER_DEFS.map(({ provider, label, keyUrl }) => {
        const { icon: Icon, color } = PROVIDER_META[provider];
        return {
            provider,
            label,
            color,
            icon: <Icon className="size-6 shrink-0" />,
            hasKey: keyStatus[provider],
            keyUrl,
        };
    });

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
