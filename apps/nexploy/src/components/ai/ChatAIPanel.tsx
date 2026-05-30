'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { ScrollArea } from '@workspace/ui/components/scroll-area';
import { useAIPanelStore } from '@/stores/useAIPanelStore';
import { useAIContext } from '@/hooks/useAIContext';
import { InsetPanel } from '@/components/layout/InsetPanel';
import { PanelHeader } from '@/components/ai/panel/PanelHeader';
import { Suggestions } from '@/components/ai/panel/Suggestions';
import { ChatMessages } from '@/components/ai/panel/ChatMessages';
import { ChatInput } from '@/components/ai/panel/ChatInput';
import { ModelSelectorModal } from '@/components/ai/panel/model-selector/ModelSelectorModal.tsx';
import { SelectedModel } from '@workspace/typescript-interface/ai/aiConfig.ts';
import { cn } from '@workspace/ui/lib/utils';

export function ChatAIPanel() {
    const isOpen = useAIPanelStore((s) => s.isOpen);
    const closePanel = useAIPanelStore((s) => s.closePanel);
    const pendingPrompt = useAIPanelStore((s) => s.pendingPrompt);
    const clearPendingPrompt = useAIPanelStore((s) => s.clearPendingPrompt);

    const [selectedModel, setSelectedModel] = useState<SelectedModel | null>(null);
    const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    const selectedModelRef = useRef(selectedModel);
    selectedModelRef.current = selectedModel;

    const transport = useMemo(
        () =>
            new DefaultChatTransport({
                api: '/api/chat',
                fetch: async (url, init) => {
                    const m = selectedModelRef.current;
                    if (m && init?.body) {
                        const parsed = JSON.parse(init.body as string);
                        init = {
                            ...init,
                            body: JSON.stringify({
                                ...parsed,
                                modelId: m.modelId,
                                provider: m.provider,
                            }),
                        };
                    }
                    return fetch(url, init as RequestInit);
                },
            }),
        [],
    );

    const { messages, sendMessage, stop, status, setMessages } = useChat({ transport });
    const { suggestions } = useAIContext();

    const isLoading = status === 'submitted' || status === 'streaming';

    const scrollToBottom = useCallback(() => {
        const viewport = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) viewport.scrollTop = viewport.scrollHeight;
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    useEffect(() => {
        if (pendingPrompt) {
            sendMessage({ text: pendingPrompt }).then(() => clearPendingPrompt());
        }
    }, [pendingPrompt, sendMessage, clearPendingPrompt]);

    const handleSubmit = useCallback(() => {
        if (!input.trim() || isLoading) return;
        sendMessage({ text: input }).then(() => setInput(''));
    }, [input, isLoading, sendMessage]);

    return (
        <div
            className={cn(
                'ml-2 shrink-0 overflow-hidden rounded-none shadow-none transition-[width,margin] duration-300 ease-in-out md:rounded-xl md:shadow-sm',
                isOpen ? 'w-80' : 'ml-0 w-0',
            )}
        >
            <InsetPanel className="h-full w-80">
                <div className="flex h-full flex-col">
                    <PanelHeader
                        isLoading={isLoading}
                        hasMessages={messages.length > 0}
                        onNewChat={() => {
                            stop();
                            setMessages([]);
                        }}
                        onStop={stop}
                        onClose={closePanel}
                    />
                    <ScrollArea className="flex-1" ref={scrollRef}>
                        <div className="flex flex-col gap-3 p-3">
                            {messages.length === 0 && (
                                <Suggestions
                                    suggestions={suggestions}
                                    onSelect={(text) => sendMessage({ text })}
                                />
                            )}
                            <ChatMessages messages={messages} isLoading={isLoading} />
                        </div>
                    </ScrollArea>
                    <ChatInput
                        value={input}
                        onChange={setInput}
                        onSubmit={handleSubmit}
                        isLoading={isLoading}
                        selectedModel={selectedModel}
                        onOpenModelSelector={() => setModelSelectorOpen(true)}
                    />
                    <ModelSelectorModal
                        open={modelSelectorOpen}
                        onOpenChange={setModelSelectorOpen}
                        selected={selectedModel}
                        onSelect={setSelectedModel}
                    />
                </div>
            </InsetPanel>
        </div>
    );
}
