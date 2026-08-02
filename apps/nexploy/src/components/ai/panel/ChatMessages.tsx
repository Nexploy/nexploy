import { useTranslations } from 'next-intl';
import { Bubble, BubbleContent } from '@workspace/ui/components/bubble';
import { Marker, MarkerContent, MarkerIcon } from '@workspace/ui/components/marker';
import { Message, MessageContent } from '@workspace/ui/components/message';
import { MessageScrollerItem } from '@workspace/ui/components/message-scroller';
import { ToolCallsSection } from '@/components/ai/panel/ToolCallsSection';
import type { TextUIPart, UIMessage } from 'ai';
import { RenderMessageText } from '@/components/ai/panel/message-renderer.tsx';
import { NexployLoader } from './NexployLoader';

interface ChatMessagesProps {
    messages: UIMessage[];
    isLoading: boolean;
    error?: Error;
}

type DynamicToolPart = {
    type: 'dynamic-tool';
    toolCallId: string;
    toolName: string;
    state: string;
    output?: unknown;
};

function isEmptyAssistantMessage(m: UIMessage): boolean {
    return m.role === 'assistant' && m.parts.every((p) => p.type !== 'text' || !(p as TextUIPart).text?.trim());
}

function ChatMessage({ message, showLoader }: { message: UIMessage; showLoader: boolean }) {
    const isUser = message.role === 'user';
    const toolParts = message.parts.filter((p) => p.type === 'dynamic-tool') as DynamicToolPart[];
    const textParts = message.parts.filter((p) => p.type === 'text') as TextUIPart[];

    return (
        <Message align={isUser ? 'end' : 'start'} className="text-xs">
            <MessageContent>
                {!isUser && toolParts.length > 0 && <ToolCallsSection tools={toolParts} />}
                <Bubble
                    variant={isUser ? 'default' : 'muted'}
                    align={isUser ? 'end' : 'start'}
                    className={isUser ? undefined : 'max-w-full'}
                >
                    <BubbleContent className="text-xs">
                        {textParts.map((part, i) => (
                            <RenderMessageText
                                key={`${message.id}-text-${i}`}
                                text={part.text}
                                isStreaming={showLoader}
                            />
                        ))}
                        {showLoader && <NexployLoader size={14} className="mt-1" />}
                    </BubbleContent>
                </Bubble>
            </MessageContent>
        </Message>
    );
}

export function ChatMessages({ messages, isLoading, error }: ChatMessagesProps) {
    const t = useTranslations('ai.chat');

    const lastMsg = messages[messages.length - 1];
    const showShimmer = isLoading && (lastMsg?.role === 'user' || (lastMsg && isEmptyAssistantMessage(lastMsg)));
    const showStreamingLoader = isLoading && lastMsg?.role === 'assistant' && !isEmptyAssistantMessage(lastMsg);

    return (
        <>
            {messages.map((message) => {
                if (isLoading && isEmptyAssistantMessage(message) && message === lastMsg) return null;

                return (
                    <MessageScrollerItem key={message.id} messageId={message.id} scrollAnchor={message.role === 'user'}>
                        {isEmptyAssistantMessage(message) ? (
                            <Marker variant="separator" className="text-[10px]">
                                <MarkerContent>{t('generationStopped')}</MarkerContent>
                            </Marker>
                        ) : (
                            <ChatMessage message={message} showLoader={showStreamingLoader && message === lastMsg} />
                        )}
                    </MessageScrollerItem>
                );
            })}

            {showShimmer && (
                <MessageScrollerItem>
                    <Message className="text-xs">
                        <MessageContent>
                            <Bubble variant="muted">
                                <BubbleContent className="text-xs">
                                    <Marker>
                                        <MarkerIcon>
                                            <NexployLoader size={14} />
                                        </MarkerIcon>
                                        <MarkerContent className={'shimmer'}>{t('thinking')}</MarkerContent>
                                    </Marker>
                                </BubbleContent>
                            </Bubble>
                        </MessageContent>
                    </Message>
                </MessageScrollerItem>
            )}

            {error && (
                <MessageScrollerItem>
                    <Message className="text-xs">
                        <MessageContent>
                            <Bubble variant="destructive" className="max-w-full">
                                <BubbleContent className="break-all text-xs">{error.message}</BubbleContent>
                            </Bubble>
                        </MessageContent>
                    </Message>
                </MessageScrollerItem>
            )}
        </>
    );
}
