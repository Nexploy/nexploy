'use client';

import { ContainerCard } from '@/components/docker/containers/ContainerCard';
import { Badge } from '@workspace/ui/components/badge';
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@workspace/ui/components/empty';
import { Container as IconContainer } from 'lucide-react';
import { useContainersStore } from '@/stores/docker/useContainersStore';
import { useTranslations } from 'next-intl';

interface ContainersStandaloneProps {
    keepEmpty?: boolean;
}

export function ContainersStandalone({ keepEmpty = false }: ContainersStandaloneProps) {
    const t = useTranslations('docker');
    const getOrganizedContainers = useContainersStore((state) => state.getOrganizedContainers);
    const { standaloneContainers } = getOrganizedContainers();

    if (standaloneContainers.length) {
        return (
            <div className="flex flex-col gap-2 px-5">
                <div className="flex items-center gap-2 px-1">
                    <span className="text-lg font-semibold">{t('containers')}</span>
                    <Badge variant={'secondary'}>{standaloneContainers.length}</Badge>
                </div>
                <div
                    className={`grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6`}
                >
                    {standaloneContainers.map((container) => (
                        <ContainerCard key={container.id} container={container} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        keepEmpty && (
            <Empty className={'mt-24'}>
                <EmptyHeader>
                    <EmptyMedia variant="icon" className={'bg-primary/10'}>
                        <IconContainer className="text-primary" />
                    </EmptyMedia>
                    <EmptyTitle>{t('noContainers')}</EmptyTitle>
                    <EmptyDescription>{t('noContainersDescription')}</EmptyDescription>
                </EmptyHeader>
            </Empty>
        )
    );
}
