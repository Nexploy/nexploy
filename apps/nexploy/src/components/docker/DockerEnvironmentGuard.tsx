'use client';

import { ReactNode } from 'react';
import { ServerOff } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@workspace/ui/components/empty';
import { useDockerStore } from '@/stores/docker/useDockerStore';
import { useEnvironmentStore } from '@/stores/docker/useEnvironmentStore';

export function DockerEnvironmentGuard({ children }: { children: ReactNode }) {
    const t = useTranslations('docker');
    const status = useDockerStore((state) => state.status);
    const environmentName = useEnvironmentStore((state) => state.getSelectedEnvironment()?.name);

    if (status !== 'not_accessible') {
        return <>{children}</>;
    }

    return (
        <Empty className="h-full flex-1">
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <ServerOff />
                </EmptyMedia>
                <EmptyTitle>{t('environmentUnavailable.title')}</EmptyTitle>
                <EmptyDescription>
                    {t('environmentUnavailable.description', {
                        name: environmentName ?? '',
                    })}
                </EmptyDescription>
            </EmptyHeader>
            <EmptyContent />
        </Empty>
    );
}
