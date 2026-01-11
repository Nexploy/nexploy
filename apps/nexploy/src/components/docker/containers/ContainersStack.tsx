'use client';

import { Badge } from '@workspace/ui/components/badge';
import { StackGroup } from '@/components/docker/containers/StackGroup';
import { useContainersStore } from '@/stores/docker/useContainersStore';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@workspace/ui/components/empty';
import { useTranslations } from 'next-intl';

export function ContainersStack() {
    const stacksMap = useContainersStore((state) => state.getOrganizedContainers)().stacks;
    const stacks = Array.from(stacksMap.entries());
    const t = useTranslations('docker.tables');

    return (
        <div className="space-y-2 px-5">
            <div className="flex items-center gap-2 px-1">
                <span className="text-lg font-semibold">{t('stacks')}</span>
                <Badge variant="secondary">{stacks.length}</Badge>
            </div>

            {stacks.length === 0 ? (
                <Empty>
                    <EmptyHeader>
                        <EmptyTitle>{t('noStacks')}</EmptyTitle>
                        <EmptyDescription>{t('noStacksDescription')}</EmptyDescription>
                    </EmptyHeader>
                </Empty>
            ) : (
                <div className="space-y-3">
                    {stacks.map(([stackName, stackContainers]) => (
                        <StackGroup
                            key={stackName}
                            stackName={stackName}
                            containers={stackContainers}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
