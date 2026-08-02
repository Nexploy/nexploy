'use client';

import { useTranslations } from 'next-intl';

export function SaveVersionConfig() {
    const t = useTranslations('repository.pipeline.config');
    return <p className="text-muted-foreground text-xs">{t('saveVersionInfo')}</p>;
}
