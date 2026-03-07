'use client';

import { useTranslations } from 'next-intl';

export function BuildConfigurationFields() {
    const t = useTranslations('repository.steps.buildConfig');
    return <p className="text-muted-foreground text-sm">{t('nodePipelineDescription')}</p>;
}
