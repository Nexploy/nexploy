'use client';

import type { ComponentProps } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@workspace/ui/components/button';

type BackButtonProps = Omit<ComponentProps<typeof Button>, 'icon'> & {
    label?: string;
};

export function BackButton({ label, onClick, children, ...props }: BackButtonProps) {
    const router = useRouter();
    const t = useTranslations('common');

    return (
        <Button
            type="button"
            variant="outline"
            icon={ArrowLeft}
            onClick={onClick ?? (() => router.back())}
            {...props}
        >
            {children ?? label ?? t('back')}
        </Button>
    );
}
