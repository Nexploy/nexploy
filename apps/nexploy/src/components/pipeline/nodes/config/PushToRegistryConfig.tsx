'use client';

import { useTranslations } from 'next-intl';
import { Label } from '@workspace/ui/components/label';
import { Input } from '@workspace/ui/components/input';
import { NodeConfigProps } from '@/components/pipeline/nodes/NodeConfigPanel';

export function PushToRegistryConfig({ config, update }: NodeConfigProps) {
    const t = useTranslations('repository.pipeline.config');
    return (
        <div className="space-y-1.5">
            <Label className="text-muted-foreground text-xs">{t('tag')}</Label>
            <Input
                value={(config.tag as string) ?? ''}
                onChange={(e) => update('tag', e.target.value || undefined)}
                placeholder={t('tagPlaceholder')}
                className="border-border bg-background text-foreground focus:border-primary h-8 text-xs"
            />
        </div>
    );
}
