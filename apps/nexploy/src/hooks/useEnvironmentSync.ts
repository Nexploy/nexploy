'use client';

import { useEffect } from 'react';
import { useEnvironmentStore } from '@/stores/environment/useEnvironmentStore';
import { useDockerStore } from '@/stores/docker/useDockerStore';
import { useContainersStore } from '@/stores/docker/useContainersStore';
import { useImagesStore } from '../stores/docker/useImagesStore';
import { useVolumesStore } from '../stores/docker/useVolumesStore';
import { useNetworksStore } from '../stores/docker/useNetworksStore';

export function useEnvironmentSync() {
    const selectedEnvironmentId = useEnvironmentStore((state) => state.selectedEnvironmentId);
    const resetDocker = useDockerStore((state) => state.reset);
    const resetContainers = useContainersStore((state) => state.reset);
    const resetImages = useImagesStore((state) => state.reset);
    const resetVolumes = useVolumesStore((state) => state.reset);
    const resetNetworks = useNetworksStore((state) => state.reset);

    useEffect(() => {
        resetDocker();
        resetContainers();
        resetImages();
        resetVolumes();
        resetNetworks();
    }, [
        selectedEnvironmentId,
        resetDocker,
        resetContainers,
        resetImages,
        resetVolumes,
        resetNetworks,
    ]);
}
