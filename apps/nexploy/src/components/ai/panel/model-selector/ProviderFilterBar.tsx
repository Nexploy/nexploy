'use client';

import { LayoutGrid } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@workspace/ui/lib/utils';
import type { Provider } from '@workspace/typescript-interface/ai/aiConfig';
import { PROVIDER_META } from '@/components/ai/providerMeta';

export type ProviderFilter = Provider | 'ALL';

interface ProviderFilterBarProps {
    providers: Provider[];
    labels: Record<Provider, string>;
    value: ProviderFilter;
    onChange: (value: ProviderFilter) => void;
}

export function ProviderFilterBar({ providers, labels, value, onChange }: ProviderFilterBarProps) {
    const t = useTranslations('ai.chat.modelSelector');

    if (providers.length <= 1) return null;

    const chipClass = (active: boolean) =>
        cn(
            'flex h-7 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium transition-colors',
            active
                ? 'border-primary bg-primary/10 text-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        );

    return (
        <div className="bg-background/50 flex items-center gap-2 overflow-x-auto border-b px-3 py-2">
            <button type="button" onClick={() => onChange('ALL')} className={chipClass(value === 'ALL')}>
                <LayoutGrid className="size-3.5 shrink-0" />
                <span>{t('allProviders')}</span>
            </button>

            {providers.map((provider) => {
                const { icon: Icon, color } = PROVIDER_META[provider];
                return (
                    <button
                        key={provider}
                        type="button"
                        onClick={() => onChange(provider)}
                        className={chipClass(value === provider)}
                    >
                        <span
                            className={cn(
                                'flex size-4 shrink-0 items-center justify-center rounded-full',
                                color,
                            )}
                        >
                            <Icon className="size-2.5 shrink-0" />
                        </span>
                        <span>{labels[provider]}</span>
                    </button>
                );
            })}
        </div>
    );
}
