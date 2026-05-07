'use client';

import { useEffect } from 'react';
import { useEnvironmentStore } from '@/stores/environment/useEnvironmentStore';
import { useDockerStore } from '@/stores/docker/useDockerStore';
import { useContainersStore } from '@/stores/docker/useContainersStore';
import { useImagesStore } from '../stores/docker/useImagesStore';
import { useVolumeStore } from '@/stores/docker/useVolumeStore';
import { useNetworkStore } from '@/stores/docker/useNetworkStore';

export function useEnvironmentSync() {
    const selectedEnvironmentId = useEnvironmentStore((state) => state.selectedEnvironmentId);
    const resetDocker = useDockerStore((state) => state.reset);
    const resetContainers = useContainersStore((state) => state.reset);
    const resetImages = useImagesStore((state) => state.reset);
    const resetVolumes = useVolumeStore((state) => state.reset);
    const resetNetworks = useNetworkStore((state) => state.reset);

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
