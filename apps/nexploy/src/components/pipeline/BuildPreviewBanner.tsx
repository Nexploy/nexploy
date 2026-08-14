'use client';

import { Eye, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Kbd } from '@workspace/ui/components/kbd';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { useHotkeys } from '@/lib/useHotKeys.ts';
import { usePipelineEditorStore } from '@/stores/pipeline/usePipelineEditorStore';
import { usePipelineDisplay } from '@/stores/pipeline/usePipelineStore';

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
        <Badge variant="secondary" className="text-muted-foreground gap-1.5 py-0 pr-0.5 pl-2">
            <Eye className="text-muted-foreground/70" />
            {t('viewingBuild', { number: buildNumber })}
            <Kbd className="text-muted-foreground/70 bg-background/60 h-4 px-1 text-[10px]">Esc</Kbd>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onExit}
                        className="hover:bg-background/60 hover:text-foreground size-5 rounded-sm"
                    >
                        <X className="size-3" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>{t('exitBuild')}</TooltipContent>
            </Tooltip>
        </Badge>
    );
}
