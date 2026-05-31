'use client';

import { useRef } from 'react';
import { ArrowUp } from 'lucide-react';
import { Textarea } from '@workspace/ui/components/textarea';
import { Button } from '@workspace/ui/components/button';
import { useTranslations } from 'next-intl';

interface ChatInputProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
    isLoading: boolean;
}

export function ChatInput({ value, onChange, onSubmit, isLoading }: ChatInputProps) {
    const t = useTranslations('ai.chat');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
        }
    };

    return (
        <div className="shrink-0 px-2 pb-2">
            <div className="bg-muted/50 flex items-end rounded-xl rounded-tl-none border">
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
                    icon={ArrowUp}
                    isLoading={isLoading}
                    disabled={isLoading || !value.trim()}
                />
            </div>
            <p className="text-muted-foreground mt-1.5 text-center text-[10px]">
                {t('keyboardHint')}
            </p>
        </div>
    );
}
