'use client';

import React, { useEffect, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import { ScrollArea } from '@workspace/ui/components/scroll-area';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { ArrowUp, Bot, ChevronLeft, Loader2, StopCircle, User } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface AICommandChatProps {
    initialInput?: string;
    onBack: () => void;
}

export function AICommandChat({ initialInput = '', onBack }: AICommandChatProps) {
    const { messages, input, handleInputChange, handleSubmit, stop, isLoading } = useChat({
        api: '/api/chat',
        initialInput,
    });
    const t = useTranslations('ai.chat');

    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            const scrollArea = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollArea) {
                scrollArea.scrollTop = scrollArea.scrollHeight;
            }
        }
    }, [messages]);

    useEffect(() => {
        setTimeout(() => inputRef.current?.focus(), 100);
    }, []);

    return (
        <div className="flex h-[500px] w-full flex-col">
            <div className="flex items-center justify-between border-b p-2">
                <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
                    <ChevronLeft className="h-4 w-4" />
                    {t('backToCommands')}
                </Button>
                {isLoading && (
                    <Button variant="ghost" size="sm" onClick={() => stop()}>
                        <StopCircle className="mr-2 h-4 w-4" />
                        {t('stopGenerating')}
                    </Button>
                )}
            </div>

            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="flex flex-col gap-4 pb-4">
                    {messages.length === 0 && (
                        <div className="text-muted-foreground mt-10 text-center">
                            <p>{t('helpMessage')}</p>
                            <p className="mt-2 text-xs">
                                {t('helpExample')}
                            </p>
                        </div>
                    )}
                    {messages.map((m) => (
                        <div
                            key={m.id}
                            className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
                        >
                            <div
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                            >
                                {m.role === 'user' ? (
                                    <User className="h-4 w-4" />
                                ) : (
                                    <Bot className="h-4 w-4" />
                                )}
                            </div>
                            <div
                                className={`max-w-[80%] rounded-lg p-3 text-sm ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                            >
                                {m.content && <p className="whitespace-pre-wrap">{m.content}</p>}
                                {m.toolInvocations?.map((toolInvocation) => {
                                    const toolCallId = toolInvocation.toolCallId;
                                    const isRunning = !('result' in toolInvocation);

                                    return (
                                        <div
                                            key={toolCallId}
                                            className="bg-background/50 text-foreground mt-2 rounded border p-2 text-xs"
                                        >
                                            <div className="mb-1 flex items-center gap-2 font-semibold">
                                                {isRunning ? (
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : (
                                                    <Bot className="h-3 w-3" />
                                                )}
                                                {toolInvocation.toolName}
                                            </div>
                                            {!isRunning &&
                                                (toolInvocation.result.message ||
                                                    JSON.stringify(toolInvocation.result))}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                    {isLoading && messages[messages.length - 1]?.role === 'user' && (
                        <div className="flex gap-3">
                            <div className="bg-muted flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
                                <Bot className="h-4 w-4" />
                            </div>
                            <div className="bg-muted flex items-center rounded-lg p-3 text-sm">
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('thinking')}
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>

            <form onSubmit={handleSubmit} className="bg-background flex gap-2 border-t p-4">
                <Input
                    ref={inputRef}
                    value={input}
                    onChange={handleInputChange}
                    placeholder={t('inputPlaceholder')}
                    className="flex-1"
                />
                <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                    <ArrowUp className="h-4 w-4" />
                </Button>
            </form>
        </div>
    );
}
