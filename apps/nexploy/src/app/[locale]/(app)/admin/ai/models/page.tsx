import { Cpu } from 'lucide-react';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { getAllProviderKeys } from '@/services/aiConfig.service';
import { ModelProviderCard } from '@/components/admin/ai/models/ModelProviderCard';

export const metadata: Metadata = {
    title: 'AI Models',
    description: 'Configure AI provider API keys',
};

export default async function AIModelsPage() {
    const [t, keys] = await Promise.all([getTranslations('ai.admin.models'), getAllProviderKeys()]);

    const providers = [
        {
            provider: 'OPENAI' as const,
            label: 'OpenAI',
            color: 'bg-[#10A37F]',
            icon: (
                <svg viewBox="0 0 24 24" className="size-5 fill-white">
                    <path d="M22.28 9.77a5.8 5.8 0 0 0-.5-4.76 5.9 5.9 0 0 0-6.34-2.83A5.87 5.87 0 0 0 11 .56a5.9 5.9 0 0 0-5.62 4.1 5.87 5.87 0 0 0-3.92 2.85 5.9 5.9 0 0 0 .73 6.92 5.8 5.8 0 0 0 .5 4.76 5.9 5.9 0 0 0 6.34 2.83A5.87 5.87 0 0 0 13 23.44a5.9 5.9 0 0 0 5.63-4.1 5.87 5.87 0 0 0 3.91-2.85 5.9 5.9 0 0 0-.72-6.72h-.54Z" />
                </svg>
            ),
            apiKey: keys.OPENAI,
        },
        {
            provider: 'ANTHROPIC' as const,
            label: 'Anthropic',
            color: 'bg-[#D97757]',
            icon: (
                <svg viewBox="0 0 24 24" className="size-5 fill-white">
                    <path d="M13.827 3.52h-3.654L6 20h3.19l.98-3.01h3.66l.98 3.01H18L13.827 3.52zm-2.966 10.97 1.14-3.52 1.14 3.52H10.86Z" />
                </svg>
            ),
            apiKey: keys.ANTHROPIC,
        },
        {
            provider: 'GOOGLE' as const,
            label: 'Google',
            color: 'bg-[#4285F4]',
            icon: (
                <svg viewBox="0 0 24 24" className="size-5 fill-white">
                    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                </svg>
            ),
            apiKey: keys.GOOGLE,
        },
        {
            provider: 'OPENROUTER' as const,
            label: 'OpenRouter',
            color: 'bg-[#6366F1]',
            icon: (
                <svg viewBox="0 0 24 24" className="size-5 fill-white">
                    <path d="M16 4l4 4-4 4V9h-4.586l-2 2 2 2H16v-1l4 4-4 4v-2H9.586L5.293 17.707A1 1 0 0 1 4 17v-2.586L1.293 11.707a1 1 0 0 1 0-1.414L4 7.586V5a1 1 0 0 1 1.293-.707L9.586 8H16V6z" />
                </svg>
            ),
            apiKey: keys.OPENROUTER,
        },
    ];

    return (
        <div className="flex h-full flex-1 flex-col">
            <div className="flex flex-col gap-4">
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
                    <div className="flex flex-col gap-3 px-5 pb-5">
                        {providers.map((provider) => (
                            <ModelProviderCard {...provider} key={provider.provider} />
                        ))}
                    </div>
                </ScrollAreaWithShadow>
            </div>
        </div>
    );
}
