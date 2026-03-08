'use client';

import { useTranslations } from 'next-intl';
import { Label } from '@workspace/ui/components/label';
import { Input } from '@workspace/ui/components/input';
import { NodeConfigProps } from '@/components/pipeline/nodes/NodeConfigPanel';

export function BuildDockerImageConfig({ config, update }: NodeConfigProps) {
    const t = useTranslations('repository.pipeline.config');
    return (
        <div className="space-y-1.5">
            <Label className="text-muted-foreground text-xs">{t('dockerfilePath')}</Label>
            <Input
                value={(config.dockerfilePath as string) ?? 'Dockerfile'}
                onChange={(e) => update('dockerfilePath', e.target.value)}
                placeholder="Dockerfile"
                className="border-border bg-background text-foreground focus:border-primary h-8 text-xs"
            />
        </div>
    );
}
