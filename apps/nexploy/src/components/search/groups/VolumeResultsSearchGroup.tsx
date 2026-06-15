'use client';

import { CommandGroup, CommandItem } from '@workspace/ui/components/command';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useSearchStore } from '@/stores/useSearchStore';
import { useVolumesStore } from '@/stores/docker/useVolumesStore';
import { useSearchItemSelect } from '@/hooks/search/useSearchItemSelect';
import { filterVolumes } from '@/hooks/search/searchFilters';
import { HardDrive } from 'lucide-react';

export function VolumeResultsSearchGroup() {
    const router = useRouter();
    const t = useTranslations('ai.command');
    const tNav = useTranslations('navigation');
    const runCommand = useSearchStore((s) => s.runCommand);
    const inputValue = useSearchStore((s) => s.inputValue);
    const allVolumes = useVolumesStore((s) => s.volumes);
    const getItemProps = useSearchItemSelect();

    const volumes = filterVolumes(allVolumes, inputValue);

    if (volumes.length === 0) return null;

    return (
        <CommandGroup heading={tNav('volumes')}>
            {volumes.map((volume) => (
                <CommandItem
                    key={volume.name}
                    {...getItemProps(`volume:${volume.name}`, () =>
                        runCommand(() =>
                            router.push(`/docker/volumes/${encodeURIComponent(volume.name)}`),
                        ),
                    )}
                >
                    <HardDrive className="text-muted-foreground h-4 w-4 shrink-0" />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                        {volume.name}
                    </span>
                    <span className="text-muted-foreground ml-3 shrink-0 text-xs">
                        {volume.driver}
                    </span>
                    <span className="text-muted-foreground ml-3 shrink-0 text-xs">
                        {t('types.volume')}
                    </span>
                </CommandItem>
            ))}
        </CommandGroup>
    );
}
