'use client';

import { CommandDialog, CommandInput, CommandList } from '@workspace/ui/components/command';
import { Button } from '@workspace/ui/components/button';
import { useTranslations } from 'next-intl';
import { useSearchStore } from './useSearchStore';
import { useSearchEffects } from './useSearchEffects';
import { SearchActionBar } from './SearchActionBar';
import { SearchNavigationList } from './SearchNavigationList';

export function SearchCommand() {
    const t = useTranslations('ai.command');

    const open = useSearchStore((s) => s.open);
    const inputValue = useSearchStore((s) => s.inputValue);
    const commandValue = useSearchStore((s) => s.commandValue);
    const openDialog = useSearchStore((s) => s.openDialog);
    const closeDialog = useSearchStore((s) => s.closeDialog);
    const setInputValue = useSearchStore((s) => s.setInputValue);
    const setCommandValue = useSearchStore((s) => s.setCommandValue);

    const { handleStartBuild, handleAskAI } = useSearchEffects();

    const isSearching = inputValue.trim().length > 0;

    const typeLabels = {
        repository: t('types.repository'),
        container: t('types.container'),
        image: t('types.image'),
        volume: t('types.volume'),
        network: t('types.network'),
    };

    return (
        <>
            <Button
                variant="outline"
                onClick={openDialog}
                className="hover:bg-muted hover:text-foreground text-muted-foreground flex h-8 flex-1 justify-between rounded-r-none px-2.5 text-sm font-normal shadow-none md:flex-none"
            >
                <span className="truncate">{t('searchPlaceholder')}</span>
            </Button>

            <CommandDialog
                title={t('searchPlaceholder')}
                open={open}
                onOpenChange={(v) => (v ? openDialog() : closeDialog())}
                className="bg-card rounded-2xl shadow-xl sm:max-w-[620px]"
                showCloseButton={false}
                commandProps={{
                    className: 'bg-card',
                    value: commandValue,
                    onValueChange: setCommandValue,
                }}
            >
                <CommandInput
                    className={'bg-background/50 border-b px-3'}
                    placeholder={t('searchPlaceholder')}
                    value={inputValue}
                    onValueChange={setInputValue}
                />

                <CommandList className="bg-card">
                    {/*<SearchResultsList typeLabels={typeLabels} onAskAI={handleAskAI} />*/}
                    <SearchNavigationList />
                </CommandList>

                <SearchActionBar handleStartBuild={handleStartBuild} />
            </CommandDialog>
        </>
    );
}
