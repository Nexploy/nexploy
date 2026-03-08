'use client';

import { useTranslations } from 'next-intl';

export function DeployContainerConfig() {
    const t = useTranslations('repository.pipeline.config');
    return <p className="text-muted-foreground text-xs">{t('deployContainerNoConfig')}</p>;
}
