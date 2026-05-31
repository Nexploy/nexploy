import { useAIPanelStore } from '@/stores/useAIPanelStore.ts';
import { cn } from '@workspace/ui/lib/utils.ts';
import { ChevronDown } from 'lucide-react';
import { Button } from '@workspace/ui/components/button.tsx';
import { useTranslations } from 'next-intl';

export function SelectModel() {
    const t = useTranslations('ai.chat');

    const selectedModel = useAIPanelStore((s) => s.selectedModel);
    const openModelSelector = useAIPanelStore((s) => s.openModelSelector);

    return (
        <div className="px-2 pt-1">
            <Button
                size="sm"
                variant="outline"
                onClick={openModelSelector}
                className={cn(
                    'flex h-7 items-center rounded-2xl rounded-b-none border-b-0 text-xs',
                    selectedModel
                        ? 'text-foreground hover:bg-muted'
                        : 'text-muted-foreground hover:bg-muted',
                )}
            >
                <span className="max-w-[180px] truncate font-medium">
                    {selectedModel ? selectedModel.label : t('selectModel')}
                </span>
                <ChevronDown className="size-3 shrink-0" />
            </Button>
        </div>
    );
}
