import { Brain } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@workspace/ui/lib/utils';
import { Shimmer } from '@workspace/ui/components/ai-elements/shimmer';
import { ToolCallCard } from '@/components/ai/panel/ToolCallCard';
import type { TextUIPart, UIMessage } from 'ai';
import { renderMessageText } from '@/components/ai/panel/message-renderer.tsx';

interface ChatMessagesProps {
    messages: UIMessage[];
    isLoading: boolean;
    error?: Error;
}

function ThinkingBubble() {
    const t = useTranslations('ai.chat');
    return (
        <div className="bg-muted flex w-fit items-center gap-2 rounded-xl px-3 py-2">
            <Brain className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
            <Shimmer className="text-xs" duration={1.8}>
                {t('thinking')}
            </Shimmer>
        </div>
    );
}

function isEmptyAssistantMessage(m: UIMessage): boolean {
    return (
        m.role === 'assistant' &&
        m.parts.every((p) => p.type !== 'text' || !(p as TextUIPart).text?.trim())
    );
}

export function ChatMessages({ messages, isLoading, error }: ChatMessagesProps) {
    const lastMsg = messages[messages.length - 1];
    const showShimmer =
        isLoading && (lastMsg?.role === 'user' || (lastMsg && isEmptyAssistantMessage(lastMsg)));

    return (
        <>
            {messages.map((m) => {
                if (isLoading && isEmptyAssistantMessage(m) && m === lastMsg) return null;

                return (
                    <div key={m.id} className="flex w-full min-w-0">
                        <div
                            className={cn(
                                'group relative min-w-0 rounded-xl px-2.5 py-2 text-xs',
                                m.role === 'user'
                                    ? 'bg-primary text-primary-foreground ml-auto max-w-[80%]'
                                    : 'bg-muted w-full',
                            )}
                        >
                            {m.parts.map((part, partIndex) => {
                                if (part.type === 'text') {
                                    return (
                                        <div
                                            key={`${m.id}-${partIndex}`}
                                            className="leading-relaxed"
                                        >
                                            {renderMessageText((part as TextUIPart).text)}
                                        </div>
                                    );
                                }
                                if (part.type === 'dynamic-tool') {
                                    return (
                                        <ToolCallCard
                                            key={part.toolCallId}
                                            toolName={part.toolName}
                                            state={part.state}
                                            output={
                                                part.state === 'output-available'
                                                    ? (part.output as unknown)
                                                    : undefined
                                            }
                                        />
                                    );
                                }
                                return null;
                            })}
                        </div>
                    </div>
                );
            })}

            {showShimmer && <ThinkingBubble />}

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
