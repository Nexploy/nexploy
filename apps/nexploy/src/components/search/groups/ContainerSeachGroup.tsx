'use client';

import { CommandGroup, CommandItem } from '@workspace/ui/components/command';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useSearchStore } from '@/stores/useSearchStore';
import { useContainersStore } from '@/stores/docker/useContainersStore';
import { useSearchItemSelect } from '@/hooks/search/useSearchItemSelect';
import { filterContainers } from '@/hooks/search/searchFilters';
import { Container } from 'lucide-react';
import { Status, StatusIndicator } from '@workspace/ui/components/kibo-ui/status';
import { containerDisplayState } from '@/utils/containerDisplayState.ts';

export function ContainerSeachGroup() {
    const router = useRouter();

    const t = useTranslations('ai.command');
    const tNav = useTranslations('navigation');

    const runCommand = useSearchStore((s) => s.runCommand);
    const inputValue = useSearchStore((s) => s.inputValue);
    const allContainers = useContainersStore((s) => s.containers);

    const getItemProps = useSearchItemSelect();

    const containers = filterContainers(allContainers, inputValue);

    if (containers.length === 0) return null;

    return (
        <CommandGroup heading={tNav('containers')}>
            {containers.map((container) => (
                <CommandItem
                    key={container.id}
                    {...getItemProps(`container:${container.id}`, () =>
                        runCommand(() => router.push(`/docker/containers/${container.id}`)),
                    )}
                >
                    <Container className="text-muted-foreground h-4 w-4 shrink-0" />
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="truncate text-sm font-medium">{container.name}</span>
                        <span className="text-muted-foreground truncate text-xs">
                            {container.image}
                        </span>
                    </div>
                    <Status
                        className="border-0"
                        status={containerDisplayState[container.state]}
                        variant="outline"
                    >
                        <StatusIndicator />
                        <div className="text-muted-foreground text-xs">{container.state}</div>
                    </Status>
                    <span className="text-muted-foreground text-xs">{t('types.container')}</span>
                </CommandItem>
            ))}
        </CommandGroup>
    );
}
