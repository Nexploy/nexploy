'use client';

import { useTranslations } from 'next-intl';
import { NodeConfigProps } from '@/components/pipeline/nodes/NodeConfigPanel';

export function CloneRepositoryConfig(_: NodeConfigProps) {
    const t = useTranslations('repository.pipeline');
    return <p className="text-muted-foreground text-xs">{t('nodes.clone-repository.noConfig')}</p>;
}
