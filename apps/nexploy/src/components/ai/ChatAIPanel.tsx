'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { type UIMessage, useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useAIPanelStore } from '@/stores/useAIPanelStore';
import { useAIContext } from '@/hooks/useAIContext';
import { useHotkeys } from '@/lib/useHotKeys';
import { InsetPanel } from '@/components/layout/InsetPanel';
import { PanelHeader } from '@/components/ai/panel/PanelHeader';
import { Suggestions } from '@/components/ai/panel/Suggestions';
import { ChatMessages } from '@/components/ai/panel/ChatMessages';
import { ChatInput } from '@/components/ai/panel/ChatInput';
import { ModelSelectorModal } from '@/components/ai/panel/model-selector/ModelSelectorModal';
import { cn } from '@workspace/ui/lib/utils';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow.tsx';
import { SelectModel } from '@/components/ai/panel/SelectModel.tsx';
import { useTranslations } from 'next-intl';
import { BotOff } from 'lucide-react';
import { useLocalStorage } from 'usehooks-ts';

export function ChatAIPanel() {
    const t = useTranslations('ai.chat');
    const isOpen = useAIPanelStore((s) => s.isOpen);
    const aiEnabled = useAIPanelStore((s) => s.aiEnabled);
    const closePanel = useAIPanelStore((s) => s.closePanel);
    const openPanel = useAIPanelStore((s) => s.openPanel);
    const pendingPrompt = useAIPanelStore((s) => s.pendingPrompt);
    const clearPendingPrompt = useAIPanelStore((s) => s.clearPendingPrompt);

    const selectedModel = useAIPanelStore((s) => s.selectedModel);
    const openModelSelector = useAIPanelStore((s) => s.openModelSelector);

    const [input, setInput] = useState('');
    const [autoScroll, setAutoScroll] = useState(true);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const lastScrollTop = useRef<number>(0);
    const selectedModelRef = useRef(selectedModel);
    selectedModelRef.current = selectedModel;

    const [persistedMessages, setPersistedMessages, clearPersistedMessages] = useLocalStorage<
        UIMessage[]
    >('ai-chat-messages', []);

    const { messages, sendMessage, stop, status, setMessages, error } = useChat({
        transport: new DefaultChatTransport({
            api: '/api/chat',
            prepareSendMessagesRequest: ({ messages }) => ({
                body: {
                    messages,
                    model: selectedModelRef.current?.modelId,
                    provider: selectedModelRef.current?.provider,
                },
            }),
        }),
        onError: (err) => {
            console.error('[ChatAIPanel]', err);
        },
    });

    const isLoading = status === 'submitted' || status === 'streaming';
    const { categories } = useAIContext();

    useEffect(() => {
        if (persistedMessages.length > 0) setMessages(persistedMessages);
    }, []);

    useEffect(() => {
        if (status !== 'ready') return;
        setPersistedMessages(messages);
    }, [messages, status, setPersistedMessages]);

    useHotkeys(
        ['meta+i', 'ctrl+i'],
        useCallback(() => {
            if (isOpen) closePanel();
            else openPanel();
        }, [isOpen, openPanel, closePanel]),
        { preventDefault: true },
    );

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = container;
            const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);

            if (distanceFromBottom <= 5) {
                setAutoScroll(true);
            } else if (scrollTop < lastScrollTop.current) {
                setAutoScroll(false);
            }

            lastScrollTop.current = scrollTop;
        };

        container.addEventListener('scroll', handleScroll, { passive: true });
        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (!autoScroll || !messagesEndRef.current) return;

        const rafId = requestAnimationFrame(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'instant', block: 'end' });
        });

        return () => cancelAnimationFrame(rafId);
    }, [messages, autoScroll, isLoading]);

    const trySendMessage = useCallback(
        (text: string) => {
            if (!selectedModel) {
                openModelSelector();
                return;
            }
            setAutoScroll(true);
            sendMessage({ text });
            setInput('');
        },
        [selectedModel, openModelSelector, sendMessage],
    );

    useEffect(() => {
        if (pendingPrompt) {
            trySendMessage(pendingPrompt);
            clearPendingPrompt();
        }
    }, [pendingPrompt, trySendMessage, clearPendingPrompt]);

    const handleResetChat = useCallback(() => {
        stop();
        setMessages([]);
        clearPersistedMessages();
    }, [stop, setMessages, clearPersistedMessages]);

    return (
        <div
            className={cn(
                'ml-2 shrink-0 overflow-hidden rounded-none shadow-none transition-[width,margin] duration-300 ease-in-out md:rounded-xl md:shadow-sm',
                isOpen ? 'w-[30%]' : 'ml-0 w-0',
            )}
        >
            <InsetPanel className="h-full w-full">
                <div className="flex h-full flex-col">
                    <PanelHeader
                        isLoading={isLoading}
                        hasMessages={messages.length > 0}
                        onNewChat={handleResetChat}
                        onClose={closePanel}
                    />
                    {!aiEnabled ? (
                        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
                            <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
                                <BotOff className="text-muted-foreground h-6 w-6" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <p className="text-sm font-medium">{t('disabled')}</p>
                                <p className="text-muted-foreground text-xs">
                                    {t('disabledDescription')}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <ScrollAreaWithShadow
                                className="h-full overflow-hidden"
                                bottomShadow
                                ref={scrollContainerRef}
                            >
                                <div className="flex w-full flex-col gap-3 px-3">
                                    {messages.length === 0 && (
                                        <Suggestions
                                            categories={categories}
                                            onSelect={trySendMessage}
                                        />
                                    )}
                                    <ChatMessages
                                        messages={messages}
                                        isLoading={isLoading}
                                        error={error}
                                    />
                                    <div ref={messagesEndRef} />
                                </div>
                            </ScrollAreaWithShadow>
                            <SelectModel />
                            <ChatInput
                                input={input}
                                onChange={setInput}
                                onSubmit={() => trySendMessage(input)}
                                onStop={stop}
                                isLoading={isLoading}
                            />
                            <ModelSelectorModal />
                        </>
                    )}
                </div>
            </InsetPanel>
        </div>
    );
}
