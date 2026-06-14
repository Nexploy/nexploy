'use client';

import { CommandGroup, CommandItem, CommandSeparator } from '@workspace/ui/components/command';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useSearchStore } from '@/stores/useSearchStore';
import { useSearchItemSelect } from '@/hooks/search/useSearchItemSelect';
import { VolumeRow } from '../SearchResultRows';
import type { TypeLabels } from '../SearchPrimitives';
import type { Volume } from '@workspace/typescript-interface/docker/docker.volume';

interface VolumeResultsGroupProps {
    volumes: Volume[];
    typeLabel: TypeLabels['volume'];
}

export function VolumeResultsGroup({ volumes, typeLabel }: VolumeResultsGroupProps) {
    const router = useRouter();
    const tNav = useTranslations('navigation');
    const runCommand = useSearchStore((s) => s.runCommand);
    const getItemProps = useSearchItemSelect();

    if (volumes.length === 0) return null;

    return (
        <>
            <CommandSeparator />
            <CommandGroup heading={tNav('volumes')}>
                {volumes.map((vol) => (
                    <CommandItem
                        key={vol.name}
                        {...getItemProps(`volume:${vol.name}`, () =>
                            runCommand(() =>
                                router.push(`/docker/volumes/${encodeURIComponent(vol.name)}`),
                            ),
                        )}
                    >
                        <VolumeRow volume={vol} typeLabel={typeLabel} />
                    </CommandItem>
                ))}
            </CommandGroup>
        </>
    );
}
