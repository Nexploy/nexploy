import { Brain } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@workspace/ui/lib/utils';
import { Shimmer } from '@workspace/ui/components/ai-elements/shimmer';
import { ToolCallsSection } from '@/components/ai/panel/ToolCallsSection';
import type { TextUIPart, UIMessage } from 'ai';
import { RenderMessageText } from '@/components/ai/panel/message-renderer.tsx';

interface ChatMessagesProps {
    messages: UIMessage[];
    isLoading: boolean;
    error?: Error;
}

function isEmptyAssistantMessage(m: UIMessage): boolean {
    return (
        m.role === 'assistant' &&
        m.parts.every((p) => p.type !== 'text' || !(p as TextUIPart).text?.trim())
    );
}

export function ChatMessages({ messages, isLoading, error }: ChatMessagesProps) {
    const t = useTranslations('ai.chat');

    const lastMsg = messages[messages.length - 1];
    const showShimmer =
        isLoading && (lastMsg?.role === 'user' || (lastMsg && isEmptyAssistantMessage(lastMsg)));

    return (
        <>
            {messages.map((m) => {
                if (isLoading && isEmptyAssistantMessage(m) && m === lastMsg) return null;

                const toolParts = m.parts
                    .filter((p) => p.type === 'dynamic-tool')
                    .map(
                        (p) =>
                            p as {
                                type: 'dynamic-tool';
                                toolCallId: string;
                                toolName: string;
                                state: string;
                                output?: unknown;
                            },
                    );

                const textParts = m.parts.filter((p) => p.type === 'text') as TextUIPart[];

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
                            {m.role === 'assistant' && toolParts.length > 0 && (
                                <ToolCallsSection tools={toolParts} />
                            )}
                            {textParts.map((part, i) => (
                                <RenderMessageText key={`${m.id}-text-${i}`} text={part.text} />
                            ))}
                        </div>
                    </div>
                );
            })}

            {showShimmer && (
                <div className="bg-muted flex w-fit items-center gap-2 rounded-xl px-3 py-2">
                    <Brain className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
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
