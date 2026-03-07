'use client';

import { useTranslations } from 'next-intl';
import { Label } from '@workspace/ui/components/label';
import { Switch } from '@workspace/ui/components/switch';
import { NodeConfigProps } from '@/components/pipeline/nodes/NodeConfigPanel';

export function WriteEnvFileConfig({ config, update }: NodeConfigProps) {
    const t = useTranslations('repository.pipeline.config');
    return (
        <div className="flex items-center justify-between">
            <Label className="text-muted-foreground text-xs">{t('useRepositoryEnvVars')}</Label>
            <Switch
                checked={(config.useRepositoryEnvVars as boolean) ?? true}
                onCheckedChange={(v) => update('useRepositoryEnvVars', v)}
            />
        </div>
    );
}
