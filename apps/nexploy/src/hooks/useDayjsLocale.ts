'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { FALLBACK_DAYJS_LOCALE, loadDayjsLocale } from '@/lib/dayjs';

export function useDayjsLocale(): string {
    const locale = useLocale();
    const [resolvedLocale, setResolvedLocale] = useState(FALLBACK_DAYJS_LOCALE);

    useEffect(() => {
        let cancelled = false;

        loadDayjsLocale(locale).then(() => {
            if (!cancelled) setResolvedLocale(locale);
        });

        return () => {
            cancelled = true;
        };
    }, [locale]);

    return resolvedLocale;
}
