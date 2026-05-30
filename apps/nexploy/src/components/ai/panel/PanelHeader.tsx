import { Bot, MessageSquarePlus, StopCircle, X } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { useTranslations } from 'next-intl';

interface PanelHeaderProps {
    isLoading: boolean;
    hasMessages: boolean;
    onNewChat: () => void;
    onStop: () => void;
    onClose: () => void;
}

export function PanelHeader({ isLoading, hasMessages, onNewChat, onStop, onClose }: PanelHeaderProps) {
    const t = useTranslations('ai.chat');

    return (
        <div className="flex shrink-0 items-center justify-between border-b px-3 py-2.5">
            <div className="flex items-center gap-2">
                <div className="bg-primary/10 flex h-6 w-6 items-center justify-center rounded-full">
                    <Bot className="text-primary h-3.5 w-3.5" />
                </div>
                <span className="text-sm font-semibold">Nexploy AI</span>
                {hasMessages && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={onNewChat}
                        title={t('newChat')}
                    >
                        <MessageSquarePlus className="h-3.5 w-3.5" />
                    </Button>
                )}
            </div>
            <div className="flex items-center gap-1">
                {isLoading && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={onStop}
                        title={t('stopGenerating')}
                    >
                        <StopCircle className="h-3.5 w-3.5" />
                    </Button>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={onClose}
                    title="Close"
                >
                    <X className="h-3.5 w-3.5" />
                </Button>
            </div>
        </div>
    );
}
