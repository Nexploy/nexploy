'use client';

import { useTranslations } from 'next-intl';
import { NodeConfigProps } from '@/components/pipeline/nodes/NodeConfigPanel';

export function DeployContainerConfig(_: NodeConfigProps) {
    const t = useTranslations('repository.pipeline.config');
    return <p className="text-muted-foreground text-xs">{t('deployContainerNoConfig')}</p>;
}
