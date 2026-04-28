'use client';

import { useTranslations } from 'next-intl';

export function EnvVarsConfig() {
    const t = useTranslations('repository.pipeline.config');
    return <p className="text-muted-foreground text-xs">{t('envVarsInfo')}</p>;
}
