'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { locales } from '@workspace/i18n';
import type { AppLocale } from '@/i18n/routing';
import { useTransition } from 'react';

export function LanguageSwitcher() {
    const locale = useLocale() as AppLocale;
    const router = useRouter();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();
    const t = useTranslations('account.language');

    const handleLanguageChange = (newLocale: AppLocale) => {
        startTransition(() => {
            router.replace(pathname, { locale: newLocale });
            router.refresh();
        });
    };

    return (
        <Select value={locale} onValueChange={handleLanguageChange} disabled={isPending}>
            <SelectTrigger className="w-full">
                <SelectValue placeholder={t('selectLanguage')} />
            </SelectTrigger>
            <SelectContent>
                {Object.keys(locales).map((localeKey) => (
                    <SelectItem key={localeKey} value={localeKey}>
                        {t(localeKey)}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
