'use client';

import { useMemo } from 'react';
import { CommandGroup, CommandItem } from '@workspace/ui/components/command';
import { Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSearchStore } from '@/stores/useSearchStore';
import { useContainersStore } from '@/stores/docker/useContainersStore';
import { useImagesStore } from '@/stores/docker/useImagesStore';
import { useVolumesStore } from '@/stores/docker/useVolumesStore';
import { useNetworksStore } from '@/stores/docker/useNetworksStore';
import { useSearchItemSelect } from '@/hooks/search/useSearchItemSelect';
import { filterContainers, filterImages, filterNetworks, filterVolumes, } from '@/hooks/search/searchFilters';
import { useAIPanelStore } from '@/stores/useAIPanelStore.ts';

export function AskAiGroup() {
    const t = useTranslations('ai.command');
    const inputValue = useSearchStore((s) => s.inputValue);
    const closeDialog = useSearchStore((s) => s.closeDialog);
    const containers = useContainersStore((s) => s.containers);
    const images = useImagesStore((s) => s.images);
    const volumes = useVolumesStore((s) => s.volumes);
    const networks = useNetworksStore((s) => s.networks);

    const openPanel = useAIPanelStore((s) => s.openPanel);

    const getItemProps = useSearchItemSelect();

    const handleAskAI = (query: string) => {
        closeDialog();
        openPanel(query);
    };

    const isSearching = inputValue.trim().length > 0;

    const hasDockerResults = useMemo(
        () =>
            filterContainers(containers, inputValue).length > 0 ||
            filterImages(images, inputValue).length > 0 ||
            filterVolumes(volumes, inputValue).length > 0 ||
            filterNetworks(networks, inputValue).length > 0,
        [containers, images, volumes, networks, inputValue],
    );

    if (!isSearching || hasDockerResults) return null;

    return (
        <CommandGroup heading={t('aiAssistant')}>
            <CommandItem {...getItemProps(`ask-ai:${inputValue}`, () => handleAskAI(inputValue))}>
                <Sparkles className="text-muted-foreground h-4 w-4 shrink-0" />
                <span className="text-sm font-medium">{t('askAi', { query: inputValue })}</span>
            </CommandItem>
        </CommandGroup>
    );
}
