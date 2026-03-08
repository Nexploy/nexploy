'use client';

import { useTranslations } from 'next-intl';

export function CloneRepositoryConfig() {
    const t = useTranslations('repository.pipeline');
    return <p className="text-muted-foreground text-xs">{t('nodes.clone-repository.noConfig')}</p>;
}
