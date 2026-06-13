'use client';

import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Panel } from '@xyflow/react';
import { Kbd } from '@workspace/ui/components/kbd';
import { Button } from '@workspace/ui/components/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { useHotkeys } from '@/lib/useHotKeys.ts';
import { usePipelineEditorStore } from '@/stores/pipeline/usePipelineEditorStore.ts';
import { usePipelineDisplay } from '@/stores/pipeline/usePipelineStore.ts';

interface BuildPreviewBannerProps {
    buildNumber: number;
    onExit: () => void;
}

export function BuildPreviewBanner({ buildNumber, onExit }: BuildPreviewBannerProps) {
    const t = useTranslations('repository.pipeline');
    const setActiveBuildId = usePipelineEditorStore((s) => s.setActiveBuildId);
    const { isViewingBuild } = usePipelineDisplay();

    useHotkeys(
        'escape',
        () => {
            if (isViewingBuild) setActiveBuildId(null);
        },
        { preventDefault: true },
    );

    return (
        <Panel position="top-center" className="!m-2 flex-1">
            <div className="bg-background/90 flex flex-1 items-center gap-2 rounded-lg border px-2 py-1.5 whitespace-nowrap shadow-sm backdrop-blur-sm">
                <span className="text-muted-foreground text-xs">
                    {t('viewingBuild', { number: buildNumber })}
                </span>
                <div className={'flex'}>
                    <Kbd className="text-muted-foreground/70 rounded-sm rounded-r-none text-xs">
                        Esc
                    </Kbd>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant={'outline'}
                                onClick={onExit}
                                className="text-muted-foreground hover:text-foreground size-5 rounded-sm rounded-l-none transition-colors"
                            >
                                <X className="size-3" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t('exitBuild')}</TooltipContent>
                    </Tooltip>
                </div>
            </div>
        </Panel>
    );
}
