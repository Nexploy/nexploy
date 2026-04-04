'use client';

import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Panel } from '@xyflow/react';
import { Kbd } from '@workspace/ui/components/kbd';
import { Button } from '@workspace/ui/components/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import * as React from 'react';

interface BuildPreviewBannerProps {
    buildNumber: number;
    onExit: () => void;
}

export function BuildPreviewBanner({ buildNumber, onExit }: BuildPreviewBannerProps) {
    const t = useTranslations('repository.pipeline');

    return (
        <Panel position="top-center" className="!m-2 flex-1">
            <div className="bg-background/90 flex flex-1 items-center gap-2 rounded-lg border px-3 py-1.5 whitespace-nowrap shadow-sm backdrop-blur-sm">
                <span className="text-muted-foreground text-xs">
                    {t('viewingBuild', { number: buildNumber })}
                </span>
                <span className="text-muted-foreground/50 text-xs">·</span>
                <Kbd className="text-muted-foreground/70 text-xs">Esc</Kbd>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            onClick={onExit}
                            className="text-muted-foreground hover:text-foreground size-5 transition-colors"
                        >
                            <X className="size-3" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t('exitBuild')}</TooltipContent>
                </Tooltip>
            </div>
        </Panel>
    );
}
