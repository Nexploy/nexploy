'use client';

import { useTranslations } from 'next-intl';
import { Alert, AlertDescription, AlertTitle } from '@workspace/ui/components/alert';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@workspace/ui/components/empty';
import { ShieldAlert } from 'lucide-react';
import {
    EnvironmentProtectionCard,
    type EnvironmentProtectionValue,
} from '@/components/admin/protection/EnvironmentProtectionCard';

interface EnvironmentProtectionSectionProps {
    environments: EnvironmentProtectionValue[];
    canManage: boolean;
}

export function EnvironmentProtectionSection({ environments, canManage }: EnvironmentProtectionSectionProps) {
    const t = useTranslations('admin.protection');

    if (environments.length === 0) {
        return (
            <Empty>
                <EmptyHeader>
                    <EmptyTitle>{t('noEnvironments')}</EmptyTitle>
                    <EmptyDescription>{t('noEnvironmentsDescription')}</EmptyDescription>
                </EmptyHeader>
            </Empty>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <Alert variant="info">
                <ShieldAlert />
                <AlertTitle>{t('scopeTitle')}</AlertTitle>
                <AlertDescription>{t('scopeDescription')}</AlertDescription>
            </Alert>

            {!canManage && (
                <Alert>
                    <ShieldAlert />
                    <AlertTitle>{t('readOnly')}</AlertTitle>
                </Alert>
            )}

            {environments.map((environment) => (
                <EnvironmentProtectionCard key={environment.id} environment={environment} canManage={canManage} />
            ))}
        </div>
    );
}
