'use client';

import { CommandDialog, CommandInput, CommandList } from '@workspace/ui/components/command';
import { Button } from '@workspace/ui/components/button';
import { useTranslations } from 'next-intl';
import { useSearchStore } from '@/stores/useSearchStore';
import { SearchActionBar } from './SearchActionBar';
import { SearchNavigationList } from './SearchNavigationList';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow.tsx';
import { SearchResultsList } from '@/components/search/SearchResultsList.tsx';
import { useHotkeys } from '@/lib/useHotKeys.ts';
import { useCallback } from 'react';

export function SearchCommand() {
    const t = useTranslations('ai.command');

    const open = useSearchStore((s) => s.open);
    const inputValue = useSearchStore((s) => s.inputValue);
    const commandValue = useSearchStore((s) => s.commandValue);
    const openDialog = useSearchStore((s) => s.openDialog);
    const closeDialog = useSearchStore((s) => s.closeDialog);
    const setInputValue = useSearchStore((s) => s.setInputValue);
    const setCommandValue = useSearchStore((s) => s.setCommandValue);

    useHotkeys(
        ['meta+k', 'ctrl+k'],
        useCallback(() => {
            if (open) closeDialog();
            else openDialog();
        }, [open]),
        { preventDefault: true },
    );

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
                    disablePointerSelection: true,
                }}
            >
                <CommandInput
                    className={'bg-background/50 border-b px-3'}
                    placeholder={t('searchPlaceholder')}
                    value={inputValue}
                    onValueChange={setInputValue}
                />
                <CommandList className="bg-card max-h-none overflow-hidden">
                    <ScrollAreaWithShadow viewportClassName="max-h-[60vh]" bottomShadow>
                        <SearchResultsList typeLabels={typeLabels} />
                        <SearchNavigationList />
                    </ScrollAreaWithShadow>
                </CommandList>
                <SearchActionBar />
            </CommandDialog>
        </>
    );
}
