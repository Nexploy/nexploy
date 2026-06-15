'use client';

import { useCallback, useState } from 'react';
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
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow.tsx';
import type { Provider } from '@workspace/typescript-interface/ai/aiConfig';
import { fetcherApi } from '@/lib/api/fetcherApi.ts';
import { useAIPanelStore } from '@/stores/useAIPanelStore';
import { ProviderGroup } from './ProviderGroup';
import { ModelSelectorActionBar } from './ModelSelectorActionBar';
import { type ProviderFilter, ProviderFilterBar } from './ProviderFilterBar';

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

    const [activeProvider, setActiveProvider] = useState<ProviderFilter>('ALL');
    const [settledProviders, setSettledProviders] = useState<Set<Provider>>(new Set());

    const { data, isLoading } = useSWR<{ providers: Provider[] }>(
        { url: '/api/ai/providers' },
        fetcherApi,
    );

    const providers = data?.providers ?? [];
    const visibleProviders =
        activeProvider === 'ALL' ? providers : providers.filter((p) => p === activeProvider);

    const handleGroupSettled = useCallback((provider: Provider) => {
        setSettledProviders((prev) => {
            if (prev.has(provider)) return prev;
            const next = new Set(prev);
            next.add(provider);
            return next;
        });
    }, []);

    const anyGroupLoading = visibleProviders.some((p) => !settledProviders.has(p));

    return (
        <CommandDialog
            title={t('title')}
            open={modelSelectorOpen}
            onOpenChange={(open) => !open && closeModelSelector()}
            className="bg-card rounded-2xl shadow-xl sm:max-w-[620px]"
            showCloseButton={false}
            commandProps={{ className: 'bg-card' }}
        >
            <CommandInput className="bg-background/50 border-b px-3" placeholder={t('search')} />
            {!isLoading && (
                <ProviderFilterBar
                    providers={providers}
                    labels={PROVIDER_LABELS}
                    value={activeProvider}
                    onChange={setActiveProvider}
                />
            )}
            <CommandList className="bg-card max-h-none overflow-hidden">
                <ScrollAreaWithShadow
                    viewportClassName="max-h-[60vh] [&>div]:!block"
                    bottomShadow
                    colorShadow="from-card via-card/50"
                >
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
                            {!anyGroupLoading && <CommandEmpty>{t('noResults')}</CommandEmpty>}
                            {visibleProviders.map((provider) => (
                                <ProviderGroup
                                    key={provider}
                                    provider={provider}
                                    label={PROVIDER_LABELS[provider]}
                                    onSettled={handleGroupSettled}
                                />
                            ))}
                        </>
                    )}
                </ScrollAreaWithShadow>
            </CommandList>
            <ModelSelectorActionBar />
        </CommandDialog>
    );
}
