'use client';

import { useTranslations } from 'next-intl';

export function WriteEnvFileConfig() {
    const t = useTranslations('repository.pipeline.config');
    return (
        <p className="text-muted-foreground text-sm">{t('envVarsInfo')}</p>
    );
}
