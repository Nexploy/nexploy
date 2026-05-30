'use client';

import { useTranslations } from 'next-intl';
import {
    CommandDialog,
    CommandEmpty,
    CommandInput,
    CommandList,
} from '@workspace/ui/components/command';
import type { AIProvider, SelectedModel } from '@workspace/typescript-interface/ai/aiConfig';
import { ProviderGroup } from './ProviderGroup';

const PROVIDERS: { id: AIProvider; label: string }[] = [
    { id: 'openai', label: 'OpenAI' },
    { id: 'anthropic', label: 'Anthropic' },
    { id: 'google', label: 'Google' },
    { id: 'openrouter', label: 'OpenRouter' },
];

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

    function handleSelect(model: SelectedModel) {
        onSelect(model);
        onOpenChange(false);
    }

    return (
        <CommandDialog open={open} modal onOpenChange={onOpenChange} title={t('title')}>
            <CommandInput placeholder={t('search')} />
            <CommandList className="max-h-[55vh]">
                <CommandEmpty>{t('noResults')}</CommandEmpty>
                {PROVIDERS.map((p) => (
                    <ProviderGroup
                        key={p.id}
                        provider={p.id}
                        label={p.label}
                        selected={selected}
                        onSelect={handleSelect}
                    />
                ))}
            </CommandList>
        </CommandDialog>
    );
}
