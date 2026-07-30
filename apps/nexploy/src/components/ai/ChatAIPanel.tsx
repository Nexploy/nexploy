'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { type UIMessage, useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import useSWR from 'swr';
import type { Provider } from '@workspace/typescript-interface/ai/aiConfig';
import { fetcherApi } from '@/lib/api/fetcherApi.ts';
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
import {
    MessageScroller,
    MessageScrollerButton,
    MessageScrollerContent,
    MessageScrollerItem,
    MessageScrollerProvider,
    MessageScrollerViewport,
} from '@workspace/ui/components/message-scroller';
import { SelectModel } from '@/components/ai/panel/SelectModel.tsx';
import { StreamAutoScroll } from '@/components/ai/panel/StreamAutoScroll';
import { useTranslations } from 'next-intl';
import { BotOff, Minimize2, Settings2 } from 'lucide-react';
import { useLocalStorage } from 'usehooks-ts';
import { Button } from '@workspace/ui/components/button';
import { Dialog, DialogContent, DialogTitle } from '@workspace/ui/components/dialog';

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
    const isFullscreen = useAIPanelStore((s) => s.isFullscreen);
    const setFullscreen = useAIPanelStore((s) => s.setFullscreen);

    const [input, setInput] = useState('');
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

    const lastMessage = messages[messages.length - 1];
    const streamingTurnId =
        lastMessage?.role === 'assistant' &&
        lastMessage.parts.some((part) => part.type === 'text' && part.text.trim().length > 0)
            ? lastMessage.id
            : undefined;

    const { categories } = useAIContext();

    const { data: providersData, isLoading: providersLoading } = useSWR<{ providers: Provider[] }>(
        aiEnabled ? { url: '/api/ai/providers' } : null,
        fetcherApi,
    );
    const hasConfiguredProvider = (providersData?.providers.length ?? 0) > 0;

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

    const trySendMessage = useCallback(
        (text: string) => {
            if (!selectedModel) {
                openModelSelector();
                return;
            }
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

    const chatBody = (
        <>
            <MessageScrollerProvider
                autoScroll
                defaultScrollPosition={messages.length === 0 ? 'start' : 'end'}
            >
                <MessageScroller className="min-h-0 flex-1">
                    <MessageScrollerViewport className="px-3">
                        <MessageScrollerContent className="gap-4 pb-2">
                            {messages.length === 0 && (
                                <MessageScrollerItem>
                                    <Suggestions
                                        categories={categories}
                                        onSelect={trySendMessage}
                                    />
                                </MessageScrollerItem>
                            )}
                            <ChatMessages messages={messages} isLoading={isLoading} error={error} />
                        </MessageScrollerContent>
                    </MessageScrollerViewport>
                    <StreamAutoScroll turnId={streamingTurnId} isStreaming={isLoading} />
                    <MessageScrollerButton className="rounded-full shadow-sm" />
                </MessageScroller>
            </MessageScrollerProvider>
            <SelectModel />
            <ChatInput
                input={input}
                onChange={setInput}
                onSubmit={() => trySendMessage(input)}
                onStop={stop}
                isLoading={isLoading}
            />
        </>
    );

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
                            <div className="bg-primary/10 flex size-9 shrink-0 items-center justify-center rounded-lg">
                                <BotOff className="text-primary size-5" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <p className="text-sm font-medium">{t('disabled')}</p>
                                <p className="text-muted-foreground text-xs">
                                    {t('disabledDescription')}
                                </p>
                            </div>
                        </div>
                    ) : !providersLoading && !hasConfiguredProvider ? (
                        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
                            <div className="bg-primary/10 flex size-9 shrink-0 items-center justify-center rounded-lg">
                                <Settings2 className="text-primary size-5" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <p className="text-sm font-medium">{t('noProvider')}</p>
                                <p className="text-muted-foreground text-xs">
                                    {t('noProviderDescription')}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {isFullscreen ? (
                                <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
                                    <p className="text-muted-foreground text-xs">
                                        {t('fullscreenActive')}
                                    </p>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-xs"
                                        onClick={() => setFullscreen(false)}
                                    >
                                        <Minimize2 className="size-3.5" />
                                        {t('exitFullscreen')}
                                    </Button>
                                </div>
                            ) : (
                                chatBody
                            )}
                            <Dialog open={isFullscreen} onOpenChange={setFullscreen}>
                                <DialogContent
                                    showCloseButton={false}
                                    className="flex h-[100dvh] w-screen max-w-none flex-col gap-0 rounded-none border-0 p-0 sm:max-w-none"
                                >
                                    <DialogTitle className="sr-only">{t('panelTitle')}</DialogTitle>
                                    <PanelHeader
                                        isLoading={isLoading}
                                        hasMessages={messages.length > 0}
                                        onNewChat={handleResetChat}
                                        onClose={() => setFullscreen(false)}
                                    />
                                    <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col">
                                        {isFullscreen && chatBody}
                                    </div>
                                </DialogContent>
                            </Dialog>
                            <ModelSelectorModal />
                        </>
                    )}
                </div>
            </InsetPanel>
        </div>
    );
}
