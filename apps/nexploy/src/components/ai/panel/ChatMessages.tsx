import { useTranslations } from 'next-intl';
import { cn } from '@workspace/ui/lib/utils';
import { Shimmer } from '@workspace/ui/components/ai-elements/shimmer';
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
    return (
        m.role === 'assistant' &&
        m.parts.every((p) => p.type !== 'text' || !(p as TextUIPart).text?.trim())
    );
}

function GenerationStoppedBanner({ label }: { label: string }) {
    return (
        <div className="flex w-full items-center gap-2 px-1">
            <div className="bg-border h-px flex-1" />
            <span className="text-muted-foreground shrink-0 text-[10px]">{label}</span>
            <div className="bg-border h-px flex-1" />
        </div>
    );
}

function MessageBubble({ message, showLoader }: { message: UIMessage; showLoader: boolean }) {
    const toolParts = message.parts.filter((p) => p.type === 'dynamic-tool') as DynamicToolPart[];
    const textParts = message.parts.filter((p) => p.type === 'text') as TextUIPart[];

    return (
        <div className="flex w-full min-w-0 flex-col">
            <div
                className={cn(
                    'group relative min-w-0 rounded-xl px-2.5 py-2 text-xs',
                    message.role === 'user'
                        ? 'bg-primary text-primary-foreground ml-auto max-w-[80%]'
                        : 'bg-muted w-full',
                )}
            >
                {message.role === 'assistant' && toolParts.length > 0 && (
                    <ToolCallsSection tools={toolParts} />
                )}
                {textParts.map((part, i) => (
                    <RenderMessageText
                        key={`${message.id}-text-${i}`}
                        text={part.text}
                        isStreaming={showLoader}
                    />
                ))}
            </div>
            {showLoader && (
                <div className="bg-muted mx-3 w-fit rounded-xl rounded-t-none px-3 pb-1.5">
                    <NexployLoader />
                </div>
            )}
        </div>
    );
}

export function ChatMessages({ messages, isLoading, error }: ChatMessagesProps) {
    const t = useTranslations('ai.chat');

    const lastMsg = messages[messages.length - 1];
    const showShimmer =
        isLoading && (lastMsg?.role === 'user' || (lastMsg && isEmptyAssistantMessage(lastMsg)));
    const showStreamingLoader =
        isLoading && lastMsg?.role === 'assistant' && !isEmptyAssistantMessage(lastMsg);

    return (
        <>
            {messages.map((message) => {
                if (isLoading && isEmptyAssistantMessage(message) && message === lastMsg)
                    return null;

                if (isEmptyAssistantMessage(message))
                    return (
                        <GenerationStoppedBanner key={message.id} label={t('generationStopped')} />
                    );

                return (
                    <MessageBubble
                        key={message.id}
                        message={message}
                        showLoader={showStreamingLoader && message === lastMsg}
                    />
                );
            })}

            {showShimmer && (
                <div className="bg-muted flex w-fit items-center gap-2 rounded-xl px-3 py-2">
                    <NexployLoader />
                    <Shimmer className="text-xs" duration={1.8}>
                        {t('thinking')}
                    </Shimmer>
                </div>
            )}

            {error && (
                <div className="flex gap-2">
                    <div className="bg-destructive/10 text-destructive rounded-xl px-2.5 py-2 text-xs break-all">
                        {error.message}
                    </div>
                </div>
            )}
        </>
    );
}
