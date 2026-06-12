'use client';

import useSWR from 'swr';
import { useTranslations } from 'next-intl';
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandList,
} from '@workspace/ui/components/command';
import { Skeleton } from '@workspace/ui/components/skeleton';
import type { Provider } from '@workspace/typescript-interface/ai/aiConfig';
import { fetcherApi } from '@/lib/api/fetcherApi.ts';
import { useAIPanelStore } from '@/stores/useAIPanelStore';
import { ProviderGroup } from './ProviderGroup';

const PROVIDER_LABELS: Record<Provider, string> = {
    OPENAI: 'OpenAI',
    ANTHROPIC: 'Anthropic',
    GOOGLE: 'Google',
    OPENROUTER: 'OpenRouter',
    MISTRAL: 'Mistral',
    GROQ: 'Groq',
    PERPLEXITY: 'Perplexity',
    GROK: 'Grok',
};

export function ModelSelectorModal() {
    const t = useTranslations('ai.chat.modelSelector');
    const modelSelectorOpen = useAIPanelStore((s) => s.modelSelectorOpen);
    const closeModelSelector = useAIPanelStore((s) => s.closeModelSelector);

    const { data, isLoading } = useSWR<{ providers: Provider[] }>(
        { url: '/api/ai/providers' },
        fetcherApi,
    );

    const providers = data?.providers ?? [];

    return (
        <CommandDialog
            showCloseButton={false}
            open={modelSelectorOpen}
            onOpenChange={(open) => !open && closeModelSelector()}
            title={t('title')}
        >
            <CommandInput placeholder={t('search')} />
            <CommandList className="max-h-[55vh]">
                {isLoading ? (
                    Array.from({ length: 2 }).map((_, i) => (
                        <CommandGroup key={i}>
                            <Skeleton className="mx-2 mb-2 h-3 w-24" />
                            {Array.from({ length: 3 }).map((_, j) => (
                                <div key={j} className="flex items-center gap-3 px-2 py-2">
                                    <Skeleton className="size-6 rounded-full" />
                                    <Skeleton className="h-4 w-40" />
                                </div>
                            ))}
                        </CommandGroup>
                    ))
                ) : (
                    <>
                        <CommandEmpty>{t('noResults')}</CommandEmpty>
                        {providers.map((provider) => (
                            <ProviderGroup
                                key={provider}
                                provider={provider}
                                label={PROVIDER_LABELS[provider]}
                            />
                        ))}
                    </>
                )}
            </CommandList>
        </CommandDialog>
    );
}
