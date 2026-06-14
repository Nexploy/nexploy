'use client';

import { CommandGroup, CommandItem, CommandSeparator } from '@workspace/ui/components/command';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useSearchStore } from '@/stores/useSearchStore';
import { useSearchItemSelect } from '@/hooks/search/useSearchItemSelect';
import { NetworkRow } from '../SearchResultRows';
import type { TypeLabels } from '../SearchPrimitives';
import type { Network } from '@workspace/typescript-interface/docker/docker.network';

interface NetworkResultsGroupProps {
    networks: Network[];
    typeLabel: TypeLabels['network'];
}

export function NetworkResultsGroup({ networks, typeLabel }: NetworkResultsGroupProps) {
    const router = useRouter();
    const tNav = useTranslations('navigation');
    const runCommand = useSearchStore((s) => s.runCommand);
    const getItemProps = useSearchItemSelect();

    if (networks.length === 0) return null;

    return (
        <>
            <CommandSeparator />
            <CommandGroup heading={tNav('networks')}>
                {networks.map((net) => (
                    <CommandItem
                        key={net.id}
                        {...getItemProps(`network:${net.id}`, () =>
                            runCommand(() => router.push(`/docker/networks/${net.id}`)),
                        )}
                    >
                        <NetworkRow network={net} typeLabel={typeLabel} />
                    </CommandItem>
                ))}
            </CommandGroup>
        </>
    );
}
