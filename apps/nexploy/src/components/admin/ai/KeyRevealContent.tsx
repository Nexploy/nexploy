import { useTranslations } from 'next-intl';
import { Key } from 'lucide-react';
import CopyButton from '@/components/shared/CopyButton.tsx';

interface KeyRevealContentProps {
    value: string;
}

export function KeyRevealContent({ value }: KeyRevealContentProps) {
    const t = useTranslations('ai.admin.mcp');

    return (
        <div className="flex flex-col gap-3 pt-1">
            <div className="flex items-center gap-2 rounded-lg border p-3">
                <Key className="text-muted-foreground size-4 shrink-0" />
                <code className="text-xs break-all">{value}</code>
                <CopyButton text={value} className="size-8 shrink-0" size="icon" variant="ghost" />
            </div>
            <p className="text-muted-foreground text-xs">{t('generatedWarning')}</p>
        </div>
    );
}
