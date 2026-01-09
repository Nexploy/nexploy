'use client';

import { Monitor, Moon, Sun, Check } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import {
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuItem,
} from '@workspace/ui/components/dropdown-menu';

const THEMES: { name: string; labelKey: 'light' | 'dark' | 'system'; icon: typeof Sun }[] = [
    { name: 'light', labelKey: 'light', icon: Sun },
    { name: 'dark', labelKey: 'dark', icon: Moon },
    { name: 'system', labelKey: 'system', icon: Monitor },
];

export function ChangeTheme() {
    const { setTheme, theme } = useTheme();
    const t = useTranslations('account.theme');

    return (
        <DropdownMenuSub>
            <DropdownMenuSubTrigger>
                <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                {t('title')}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
                {THEMES.map(({ name, labelKey, icon: Icon }) => (
                    <DropdownMenuItem
                        key={name}
                        onClick={() => setTheme(name)}
                        className="flex items-center justify-between gap-2"
                    >
                        <div className="flex items-center gap-2">
                            <Icon className="size-4" />
                            <span>{t(labelKey)}</span>
                        </div>
                        {theme === name && <Check className="size-4" />}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuSubContent>
        </DropdownMenuSub>
    );
}
