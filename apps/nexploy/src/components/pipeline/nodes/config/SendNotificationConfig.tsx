'use client';

import { useTranslations } from 'next-intl';
import { Label } from '@workspace/ui/components/label';
import { Input } from '@workspace/ui/components/input';
import { NodeConfigProps } from '@/components/pipeline/nodes/NodeConfigPanel';

export function SendNotificationConfig({ config, update }: NodeConfigProps) {
    const t = useTranslations('repository.pipeline.config');
    return (
        <>
            <div className="space-y-1.5">
                <Label className="text-muted-foreground text-xs">{t('webhookUrl')}</Label>
                <Input
                    value={(config.webhookUrl as string) ?? ''}
                    onChange={(e) => update('webhookUrl', e.target.value)}
                    placeholder="https://hooks.example.com/…"
                    className="border-border bg-background text-foreground focus:border-primary h-8 text-xs"
                />
            </div>
            <div className="space-y-1.5">
                <Label className="text-muted-foreground text-xs">{t('message')}</Label>
                <Input
                    value={(config.message as string) ?? ''}
                    onChange={(e) => update('message', e.target.value || undefined)}
                    placeholder={t('messagePlaceholder')}
                    className="border-border bg-background text-foreground focus:border-primary h-8 text-xs"
                />
            </div>
        </>
    );
}
