'use client';

import { CommandGroup, CommandItem, CommandSeparator } from '@workspace/ui/components/command';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useSearchStore } from '@/stores/useSearchStore';
import { useSearchItemSelect } from '@/hooks/search/useSearchItemSelect';
import { ContainerRow } from '../SearchResultRows';
import type { TypeLabels } from '../SearchPrimitives';
import type { Containers } from '@workspace/typescript-interface/docker/docker.containers';

interface ContainerResultsGroupProps {
    containers: Containers[];
    typeLabel: TypeLabels['container'];
}

export function ContainerResultsGroup({ containers, typeLabel }: ContainerResultsGroupProps) {
    const router = useRouter();
    const tNav = useTranslations('navigation');
    const runCommand = useSearchStore((s) => s.runCommand);
    const getItemProps = useSearchItemSelect();

    if (containers.length === 0) return null;

    return (
        <>
            <CommandSeparator />
            <CommandGroup heading={tNav('containers')}>
                {containers.map((c) => (
                    <CommandItem
                        key={c.id}
                        {...getItemProps(`container:${c.id}`, () =>
                            runCommand(() => router.push(`/docker/containers/${c.id}`)),
                        )}
                    >
                        <ContainerRow container={c} typeLabel={typeLabel} />
                    </CommandItem>
                ))}
            </CommandGroup>
        </>
    );
}
