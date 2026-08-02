'use client';

import { useTranslations } from 'next-intl';

export function CleanWorkdirConfig() {
    const t = useTranslations('repository.pipeline.config');
    return <p className="text-muted-foreground text-xs">{t('cleanWorkdirInfo')}</p>;
}
