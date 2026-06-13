'use client';

import { useLocale, useTranslations } from 'next-intl';
import type { AppLocale } from '@/i18n/routing';
import { Check, Languages } from 'lucide-react';
import { locales } from '@workspace/i18n';
import {
    DropdownMenuItem,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { usePathname, useRouter } from '@/i18n/navigation';

const LOCALE_CODES = Object.keys(locales) as AppLocale[];

export function ChangeLanguage() {
    const locale = useLocale() as AppLocale;
    const t = useTranslations('account.language');
    const router = useRouter();
    const pathname = usePathname();

    const handleLocaleChange = (nextLocale: AppLocale) => {
        router.replace(pathname, { locale: nextLocale });
        router.refresh();
    };

    return (
        <DropdownMenuSub>
            <DropdownMenuSubTrigger>
                <Languages className="size-4" />
                {t('title')}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
                {LOCALE_CODES.map((localeCode) => (
                    <DropdownMenuItem
                        key={localeCode}
                        onClick={() => handleLocaleChange(localeCode)}
                        className="flex items-center justify-between gap-2"
                    >
                        <span>{t(localeCode)}</span>
                        {locale === localeCode && <Check className="size-4" />}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuSubContent>
        </DropdownMenuSub>
    );
}
