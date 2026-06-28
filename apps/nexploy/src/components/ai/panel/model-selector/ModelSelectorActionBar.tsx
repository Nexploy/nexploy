'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@workspace/ui/components/button.tsx';
import { Kbd } from '@workspace/ui/components/kbd.tsx';

export function ModelSelectorActionBar() {
    const t = useTranslations('ai.chat.modelSelector');

    return (
        <div className="bg-background/50 flex items-center justify-end gap-3 border-t p-2">
            <Button size={'sm'} variant={'outline'} className="flex h-7 items-center pr-1!">
                <span className="text-muted-foreground text-xs font-medium">{t('select')}</span>
                <Kbd>↵</Kbd>
            </Button>
        </div>
    );
}
