'use client';

import { useRef } from 'react';
import { ArrowUp, ChevronDown } from 'lucide-react';
import { Textarea } from '@workspace/ui/components/textarea';
import { Button } from '@workspace/ui/components/button';
import { useTranslations } from 'next-intl';
import { cn } from '@workspace/ui/lib/utils';
import type { SelectedModel } from '@/components/ai/panel/ModelSelectorModal';

interface ChatInputProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
    isLoading: boolean;
    selectedModel: SelectedModel | null;
    onOpenModelSelector: () => void;
}

export function ChatInput({
    value,
    onChange,
    onSubmit,
    isLoading,
    selectedModel,
    onOpenModelSelector,
}: ChatInputProps) {
    const t = useTranslations('ai.chat');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
        }
    };

    return (
        <div className="shrink-0 border-t p-2">
            <div className="bg-muted/50 flex flex-col rounded-xl border">
                <div className="px-3 pt-2">
                    <button
                        type="button"
                        onClick={onOpenModelSelector}
                        className={cn(
                            'flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors',
                            selectedModel
                                ? 'text-foreground hover:bg-muted'
                                : 'text-muted-foreground hover:bg-muted',
                        )}
                    >
                        <span className="max-w-[180px] truncate font-medium">
                            {selectedModel ? selectedModel.label : t('selectModel')}
                        </span>
                        <ChevronDown className="size-3 shrink-0" />
                    </button>
                </div>
                <div className="flex items-end">
                    <Textarea
                        ref={textareaRef}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={t('inputPlaceholder')}
                        className="max-h-24 resize-none border-0 !bg-transparent shadow-none focus-visible:ring-0"
                        rows={1}
                    />
                    <Button
                        onClick={onSubmit}
                        size="icon"
                        className="m-2 size-7 shrink-0"
                        isLoading={isLoading}
                        disabled={isLoading || !value.trim()}
                    >
                        <ArrowUp />
                    </Button>
                </div>
            </div>
            <p className="text-muted-foreground mt-1.5 text-center text-[10px]">
                {t('keyboardHint')}
            </p>
        </div>
    );
}
