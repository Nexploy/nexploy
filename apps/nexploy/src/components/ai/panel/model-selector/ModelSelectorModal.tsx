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
import type { Provider, SelectedModel } from '@workspace/typescript-interface/ai/aiConfig';
import { fetcherApi } from '@/lib/api/fetcherApi.ts';
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

interface ModelSelectorModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selected: SelectedModel | null;
    onSelect: (model: SelectedModel) => void;
}

export function ModelSelectorModal({
    open,
    onOpenChange,
    selected,
    onSelect,
}: ModelSelectorModalProps) {
    const t = useTranslations('ai.chat.modelSelector');

    const { data, isLoading } = useSWR<{ providers: Provider[] }>(
        { url: '/api/ai/providers' },
        fetcherApi,
    );

    const providers = data?.providers ?? [];

    function handleSelect(model: SelectedModel) {
        onSelect(model);
        onOpenChange(false);
    }

    return (
        <CommandDialog open={open} onOpenChange={onOpenChange} title={t('title')}>
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
                                selected={selected}
                                onSelect={handleSelect}
                            />
                        ))}
                    </>
                )}
            </CommandList>
        </CommandDialog>
    );
}
