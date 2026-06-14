'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchStore } from '@/stores/useSearchStore';
import { Button } from '@workspace/ui/components/button.tsx';
import { Kbd } from '@workspace/ui/components/kbd.tsx';
import { useSearchEffects } from '@/hooks/search/useSearchEffects.ts';

export function SearchActionBar() {
    const commandValue = useSearchStore((s) => s.commandValue);
    const t = useTranslations('ai.command');
    const tBuild = useTranslations('repository.builds');
    const { handleStartBuild } = useSearchEffects();

    const primaryLabel = useMemo(() => {
        if (!commandValue) return null;
        if (commandValue.startsWith('ask-ai:')) return t('aiAssistant');
        if (commandValue.startsWith('nav:')) return t('navigate');
        return t('open');
    }, [commandValue, t]);

    const secondaryAction = useMemo(() => {
        if (!commandValue.startsWith('repo:')) return null;
        const repoId = commandValue.slice(5);
        return {
            label: tBuild('runBuild'),
            hotkeys: ['⌘', '↵'],
            handler: () => handleStartBuild(repoId),
        };
    }, [commandValue, tBuild, handleStartBuild]);

    if (!primaryLabel) return null;

    return (
        <div className="bg-background/50 flex items-center justify-end gap-3 border-t p-2">
            <Button size={'sm'} variant={'outline'} className="flex h-7 items-center !pr-1">
                <span className="text-muted-foreground text-xs font-medium">{primaryLabel}</span>
                <Kbd>↵</Kbd>
            </Button>

            {secondaryAction && (
                <>
                    <div className="bg-border h-3.5 w-px" />
                    <Button
                        size={'sm'}
                        className="flex h-7 cursor-pointer items-center gap-1.5"
                        onClick={() => secondaryAction.handler()}
                    >
                        <span className="text-xs font-medium transition-colors">
                            {secondaryAction.label}
                        </span>
                        {secondaryAction.hotkeys.map((k) => (
                            <Kbd key={k}>{k}</Kbd>
                        ))}
                    </Button>
                </>
            )}
        </div>
    );
}
