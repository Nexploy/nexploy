import { useAIPanelStore } from '@/stores/useAIPanelStore.ts';
import { cn } from '@workspace/ui/lib/utils';
import { ChevronDown, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { useTranslations } from 'next-intl';

export function ChatToolbar() {
    const t = useTranslations('ai.chat');

    const selectedModel = useAIPanelStore((s) => s.selectedModel);
    const openModelSelector = useAIPanelStore((s) => s.openModelSelector);
    const isFullscreen = useAIPanelStore((s) => s.isFullscreen);
    const toggleFullscreen = useAIPanelStore((s) => s.toggleFullscreen);

    const tabClassName = 'flex h-7 items-center rounded-2xl rounded-b-none border-b-0 text-xs';

    return (
        <div className="mt-1 flex items-center justify-between gap-1.5 px-3 pt-1">
            <Button
                size="sm"
                variant="outline"
                onClick={openModelSelector}
                className={cn(
                    tabClassName,
                    selectedModel ? 'text-foreground hover:bg-muted' : 'text-muted-foreground hover:bg-muted',
                )}
            >
                <span className="max-w-[180px] truncate font-medium">
                    {selectedModel ? selectedModel.label : t('selectModel')}
                </span>
                <ChevronDown className="size-3 shrink-0" />
            </Button>
            <Button
                size="sm"
                variant="outline"
                onClick={toggleFullscreen}
                title={isFullscreen ? t('exitFullscreen') : t('fullscreen')}
                aria-label={isFullscreen ? t('exitFullscreen') : t('fullscreen')}
                className={cn(tabClassName, 'text-muted-foreground hover:bg-muted px-2')}
            >
                {isFullscreen ? <Minimize2 className="size-3 shrink-0" /> : <Maximize2 className="size-3 shrink-0" />}
            </Button>
        </div>
    );
}
