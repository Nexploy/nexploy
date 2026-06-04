'use client';

import { useTranslations } from 'next-intl';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';
import { Switch } from '@workspace/ui/components/switch';
import { Separator } from '@workspace/ui/components/separator';
import { updateAISettingsAction } from '@/actions/admin/ai/updateAiSettings.action';

interface AISettingsSectionProps {
    requireDestructiveConfirmation: boolean;
}

export function AISettingsSection({ requireDestructiveConfirmation }: AISettingsSectionProps) {
    const t = useTranslations('ai.admin.settings');

    const { execute } = useAction(updateAISettingsAction, {
        onError: () => toast.error(t('saveFailed')),
    });

    return (
        <div className="bg-card rounded-xl border shadow-sm">
            <div className="flex flex-col gap-1 p-4">
                <span className="text-sm font-medium">{t('chatBehavior')}</span>
                <span className="text-muted-foreground text-xs">
                    {t('chatBehaviorDescription')}
                </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between p-4">
                <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">{t('requireConfirmation')}</span>
                    <span className="text-muted-foreground text-xs">
                        {t('requireConfirmationDescription')}
                    </span>
                </div>
                <Switch
                    defaultChecked={requireDestructiveConfirmation}
                    onCheckedChange={(checked) =>
                        execute({ requireDestructiveConfirmation: checked })
                    }
                />
            </div>
        </div>
    );
}
