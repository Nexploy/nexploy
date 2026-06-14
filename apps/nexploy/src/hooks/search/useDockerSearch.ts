import { useMemo } from 'react';
import { useContainersStore } from '@/stores/docker/useContainersStore';
import { useImagesStore } from '@/stores/docker/useImagesStore';
import { useVolumesStore } from '@/stores/docker/useVolumesStore';
import { useNetworksStore } from '@/stores/docker/useNetworksStore';
import type { Containers } from '@workspace/typescript-interface/docker/docker.containers';
import type { Image } from '@workspace/typescript-interface/docker/docker.image';
import type { Volume } from '@workspace/typescript-interface/docker/docker.volume';
import type { Network } from '@workspace/typescript-interface/docker/docker.network';

const MAX_PER_TYPE = 5;

export interface DockerSearchResults {
    containers: Containers[];
    images: Image[];
    volumes: Volume[];
    networks: Network[];
    hasResults: boolean;
}

export function useDockerSearch(query: string): DockerSearchResults {
    const containers = useContainersStore((s) => s.containers);
    const images = useImagesStore((s) => s.images);
    const volumes = useVolumesStore((s) => s.volumes);
    const networks = useNetworksStore((s) => s.networks);

    return useMemo(() => {
        const q = query.toLowerCase().trim();
        if (!q) {
            return { containers: [], images: [], volumes: [], networks: [], hasResults: false };
        }

        const matchedContainers = containers
            .filter(
                (c) =>
                    c.name.toLowerCase().includes(q) ||
                    c.image.toLowerCase().includes(q) ||
                    c.id.toLowerCase().startsWith(q),
            )
            .slice(0, MAX_PER_TYPE);

        const matchedImages = images
            .filter(
                (img) =>
                    img.repoTags?.some((t) => t.toLowerCase().includes(q)) ||
                    img.id.toLowerCase().startsWith(q),
            )
            .slice(0, MAX_PER_TYPE);

        const matchedVolumes = volumes
            .filter((vol) => vol.name.toLowerCase().includes(q))
            .slice(0, MAX_PER_TYPE);

        const matchedNetworks = networks
            .filter(
                (net) =>
                    net.name.toLowerCase().includes(q) || net.id.toLowerCase().startsWith(q),
            )
            .slice(0, MAX_PER_TYPE);

        const hasResults =
            matchedContainers.length > 0 ||
            matchedImages.length > 0 ||
            matchedVolumes.length > 0 ||
            matchedNetworks.length > 0;

        return {
            containers: matchedContainers,
            images: matchedImages,
            volumes: matchedVolumes,
            networks: matchedNetworks,
            hasResults,
        };
    }, [query, containers, images, volumes, networks]);
}
