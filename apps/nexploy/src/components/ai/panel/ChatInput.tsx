'use client';

import { useRef } from 'react';
import { ArrowUp, Square } from 'lucide-react';
import { Textarea } from '@workspace/ui/components/textarea';
import { Button } from '@workspace/ui/components/button';
import { useTranslations } from 'next-intl';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow.tsx';

interface ChatInputProps {
    input: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
    onStop: () => void;
    isLoading: boolean;
}

export function ChatInput({ input, onChange, onSubmit, onStop, isLoading }: ChatInputProps) {
    const t = useTranslations('ai.chat');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            input.trim() !== '' && onSubmit();
        }
    };

    return (
        <div className="shrink-0 px-3 pb-2">
            <div className="flex items-end rounded-xl rounded-t-none border bg-card">
                <div className="min-w-0 flex-1">
                    <ScrollAreaWithShadow viewportClassName="max-h-24 [&>div]:w-full! [&>div]:table-fixed!">
                        <Textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => onChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={t('inputPlaceholder')}
                            className="wrap-break-word w-full max-w-full resize-none border-0 bg-transparent! shadow-none focus-visible:ring-0"
                            rows={1}
                        />
                    </ScrollAreaWithShadow>
                </div>
                {isLoading ? (
                    <Button
                        onClick={onStop}
                        size="icon"
                        variant="outline"
                        className="m-2 size-7 shrink-0"
                        icon={Square}
                    />
                ) : (
                    <Button
                        onClick={onSubmit}
                        size="icon"
                        className="m-2 size-7 shrink-0"
                        icon={ArrowUp}
                        disabled={!input.trim()}
                    />
                )}
            </div>
            <p className="mt-1.5 text-center text-[10px] text-muted-foreground">{t('keyboardHint')}</p>
        </div>
    );
}
