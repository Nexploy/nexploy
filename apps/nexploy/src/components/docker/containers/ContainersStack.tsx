'use client';

import { Badge } from '@workspace/ui/components/badge';
import { StackGroup } from '@/components/docker/containers/StackGroup';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@workspace/ui/components/empty';
import { useTranslations } from 'next-intl';
import { Containers } from '@workspace/typescript-interface/docker/docker.containers';

interface ContainersStackProps {
    stacks: [string, Containers[]][];
    isSearching?: boolean;
}

export function ContainersStack({ stacks, isSearching = false }: ContainersStackProps) {
    const t = useTranslations('docker.tables');

    return (
        <div className="flex flex-col gap-2 px-5">
            <div className="flex items-center gap-2 px-1">
                <span className="text-lg font-semibold">{t('stacks')}</span>
                <Badge variant="secondary">{stacks.length}</Badge>
            </div>

            {stacks.length === 0 ? (
                <Empty>
                    <EmptyHeader>
                        <EmptyTitle>{isSearching ? t('noStacksMatchSearch') : t('noStacks')}</EmptyTitle>
                        {!isSearching && <EmptyDescription>{t('noStacksDescription')}</EmptyDescription>}
                    </EmptyHeader>
                </Empty>
            ) : (
                <div className="space-y-3">
                    {stacks.map(([stackName, stackContainers]) => (
                        <StackGroup key={stackName} stackName={stackName} containers={stackContainers} />
                    ))}
                </div>
            )}
        </div>
    );
}
