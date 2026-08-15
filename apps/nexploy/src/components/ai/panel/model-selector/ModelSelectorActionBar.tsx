'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@workspace/ui/components/button';
import { Kbd } from '@workspace/ui/components/kbd.tsx';

export function ModelSelectorActionBar() {
    const t = useTranslations('ai.chat.modelSelector');

    return (
        <div className="flex items-center justify-end gap-3 border-t bg-background/50 p-2">
            <Button size={'sm'} variant={'outline'} className="flex h-7 items-center pr-1!">
                <span className="font-medium text-muted-foreground text-xs">{t('select')}</span>
                <Kbd>↵</Kbd>
            </Button>
        </div>
    );
}
