'use client';

import { useTranslations } from 'next-intl';

export function InjectEnvVarsConfig() {
    const t = useTranslations('repository.pipeline.config');
    return <p className="text-muted-foreground text-xs">{t('injectEnvVarsInfo')}</p>;
}
