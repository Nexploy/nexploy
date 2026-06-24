'use client';

import { Bot } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@workspace/ui/components/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { Kbd } from '@workspace/ui/components/kbd';
import { useAIPanelStore } from '@/stores/useAIPanelStore';
import { mod } from '@/components/pipeline/utils/modKey';

export function AIPanelToggle() {
    const t = useTranslations('ai');
    const isOpen = useAIPanelStore((s) => s.isOpen);
    const openPanel = useAIPanelStore((s) => s.openPanel);
    const closePanel = useAIPanelStore((s) => s.closePanel);

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    className={'size-8 rounded-l-none'}
                    onClick={() => (isOpen ? closePanel() : openPanel())}
                >
                    <Bot />
                </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="flex items-center gap-1.5">
                {isOpen ? t('chat.closePanel') : t('chat.openPanel')}
                <Kbd className="px-1" suppressHydrationWarning>{mod}I</Kbd>
            </TooltipContent>
        </Tooltip>
    );
}
