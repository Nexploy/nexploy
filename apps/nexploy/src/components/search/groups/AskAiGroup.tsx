'use client';

import { CommandGroup, CommandItem } from '@workspace/ui/components/command';
import { Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSearchStore } from '@/stores/useSearchStore';
import { useSearchItemSelect } from '@/hooks/search/useSearchItemSelect';
import { useSearchEffects } from '@/hooks/search/useSearchEffects.ts';

export function AskAiGroup() {
    const t = useTranslations('ai.command');
    const inputValue = useSearchStore((s) => s.inputValue);
    const getItemProps = useSearchItemSelect();

    const { handleAskAI } = useSearchEffects();

    const isSearching = inputValue.trim().length > 0;

    if (!isSearching) return null;

    return (
        <CommandGroup heading={t('aiAssistant')}>
            <CommandItem {...getItemProps(`ask-ai:${inputValue}`, () => handleAskAI(inputValue))}>
                <Sparkles className="text-muted-foreground h-4 w-4 shrink-0" />
                <span className="text-sm font-medium">{t('askAi', { query: inputValue })}</span>
            </CommandItem>
        </CommandGroup>
    );
}
