import { Bot, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@workspace/ui/lib/utils';
import { ToolCallCard } from '@/components/ai/panel/ToolCallCard';
import { renderMessageText } from '@/components/ai/panel/message-renderer';
import type { DynamicToolUIPart, TextUIPart, UIMessage } from 'ai';
import CopyButton from '@/components/shared/CopyButton.tsx';

interface ChatMessagesProps {
    messages: UIMessage[];
    isLoading: boolean;
}

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
    const t = useTranslations('ai.chat');

    return (
        <>
            {messages.map((m) => (
                <div
                    key={m.id}
                    className={cn('flex gap-2', m.role === 'user' ? 'flex-row-reverse' : '')}
                >
                    <div
                        className={cn(
                            'flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                            m.role === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground',
                        )}
                    >
                        {m.role === 'user' ? (
                            <span className="text-[10px] font-semibold">U</span>
                        ) : (
                            <Bot className="h-3 w-3" />
                        )}
                    </div>

                    <div
                        className={cn(
                            'group relative max-w-[85%] rounded-xl px-2.5 py-2 text-xs',
                            m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted',
                        )}
                    >
                        {m.parts.map((part, partIndex) => {
                            if (part.type === 'text') {
                                return (
                                    <div key={`${m.id}-${partIndex}`} className="leading-relaxed">
                                        {renderMessageText((part as TextUIPart).text)}
                                    </div>
                                );
                            }
                            if (part.type === 'dynamic-tool') {
                                const dynPart = part as DynamicToolUIPart;
                                return (
                                    <ToolCallCard
                                        key={dynPart.toolCallId}
                                        toolName={dynPart.toolName}
                                        state={dynPart.state}
                                        output={
                                            dynPart.state === 'output-available'
                                                ? (dynPart.output as unknown)
                                                : undefined
                                        }
                                    />
                                );
                            }
                            return null;
                        })}
                        {m.role === 'assistant' && (
                            <CopyButton
                                text={m.parts
                                    .filter((p): p is TextUIPart => p.type === 'text')
                                    .map((p) => p.text)
                                    .join('')}
                            />
                        )}
                    </div>
                </div>
            ))}

            {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex gap-2">
                    <div className="bg-muted text-muted-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                        <Bot className="h-3 w-3" />
                    </div>
                    <div className="bg-muted flex items-center gap-2 rounded-xl px-2.5 py-2">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span className="text-muted-foreground text-xs">{t('thinking')}</span>
                    </div>
                </div>
            )}
        </>
    );
}
