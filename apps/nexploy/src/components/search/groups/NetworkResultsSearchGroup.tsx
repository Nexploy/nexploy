'use client';

import { CommandGroup, CommandItem } from '@workspace/ui/components/command';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useSearchStore } from '@/stores/useSearchStore';
import { useNetworksStore } from '@/stores/docker/useNetworksStore';
import { useSearchItemSelect } from '@/hooks/search/useSearchItemSelect';
import { filterNetworks } from '@/hooks/search/searchFilters';
import { EthernetPort } from 'lucide-react';

export function NetworkResultsSearchGroup() {
    const router = useRouter();
    const t = useTranslations('ai.command');
    const tNav = useTranslations('navigation');
    const runCommand = useSearchStore((s) => s.runCommand);
    const inputValue = useSearchStore((s) => s.inputValue);
    const allNetworks = useNetworksStore((s) => s.networks);
    const getItemProps = useSearchItemSelect();

    const networks = filterNetworks(allNetworks, inputValue);

    if (networks.length === 0) return null;

    return (
        <CommandGroup heading={tNav('networks')}>
            {networks.map((net) => (
                <CommandItem
                    key={net.id}
                    {...getItemProps(`network:${net.id}`, () =>
                        runCommand(() => router.push(`/docker/networks/${net.id}`)),
                    )}
                >
                    <EthernetPort className="text-muted-foreground h-4 w-4 shrink-0" />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{net.name}</span>
                    <span className="text-muted-foreground ml-3 shrink-0 text-xs">
                        {net.driver}
                    </span>
                    <span className="text-muted-foreground ml-3 shrink-0 text-xs">
                        {t('types.network')}
                    </span>
                </CommandItem>
            ))}
        </CommandGroup>
    );
}
