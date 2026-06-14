import { Bot, MessageSquarePlus, X } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { useTranslations } from 'next-intl';

interface PanelHeaderProps {
    isLoading: boolean;
    hasMessages: boolean;
    onNewChat: () => void;
    onClose: () => void;
}

export function PanelHeader({ hasMessages, onNewChat, onClose }: PanelHeaderProps) {
    const t = useTranslations('ai.chat');

    return (
        <div className="flex items-center justify-between gap-2 px-3 py-2.5">
            <div className={'flex gap-2'}>
                <div className="flex items-center gap-2">
                    <div className="bg-primary/10 flex h-6 w-6 items-center justify-center rounded-sm">
                        <Bot className="text-primary h-3.5 w-3.5" />
                    </div>
                    <span className="text-sm font-semibold">{t('panelTitle')}</span>
                </div>
                {hasMessages && (
                    <Button
                        size={'sm'}
                        className={'h-7 text-xs'}
                        onClick={onNewChat}
                        title={t('newChat')}
                    >
                        <MessageSquarePlus className="size-3.5" />
                        {t('newChat')}
                    </Button>
                )}
            </div>
            <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onClose}
                title={t('close')}
            >
                <X className="h-3.5 w-3.5" />
            </Button>
        </div>
    );
}
