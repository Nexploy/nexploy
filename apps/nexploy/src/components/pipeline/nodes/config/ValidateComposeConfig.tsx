'use client';

import { useTranslations } from 'next-intl';
import { Label } from '@workspace/ui/components/label';
import { Input } from '@workspace/ui/components/input';
import { NodeConfigProps } from '@/components/pipeline/nodes/NodeConfigPanel';

export function ValidateComposeConfig({ config, update }: NodeConfigProps) {
    const t = useTranslations('repository.pipeline.config');

    return (
        <>
            <div className="space-y-1.5">
                <Label className="text-muted-foreground text-xs">{t('composeFileName')}</Label>
                <Input
                    value={(config.composeFileName as string) ?? 'docker-compose.yml'}
                    onChange={(e) => update('composeFileName', e.target.value)}
                    placeholder="docker-compose.yml"
                    className="border-border bg-background text-foreground focus:border-primary h-8 text-xs"
                />
            </div>
            <div className="space-y-1.5">
                <Label className="text-muted-foreground text-xs">{t('composeFilePath')}</Label>
                <Input
                    value={(config.composeFilePath as string) ?? ''}
                    onChange={(e) => update('composeFilePath', e.target.value || undefined)}
                    placeholder={t('composeFilePathPlaceholder')}
                    className="border-border bg-background text-foreground focus:border-primary h-8 text-xs"
                />
            </div>
        </>
    );
}
