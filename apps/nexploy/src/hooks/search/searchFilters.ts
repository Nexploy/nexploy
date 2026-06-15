import type { Containers } from '@workspace/typescript-interface/docker/docker.containers';
import type { Image } from '@workspace/typescript-interface/docker/docker.image';
import type { Volume } from '@workspace/typescript-interface/docker/docker.volume';
import type { Network } from '@workspace/typescript-interface/docker/docker.network';
import type { RepositoryResult } from '@workspace/typescript-interface/repository/search';

export function normalizeQuery(query: string): string {
    return query.toLowerCase().trim();
}

export function matchesQuery(text: string, query: string): boolean {
    const q = normalizeQuery(query);
    if (!q) return true;
    return text.toLowerCase().includes(q);
}

export function filterRepositories(
    repositories: RepositoryResult[],
    query: string,
): RepositoryResult[] {
    const q = normalizeQuery(query);
    if (!q) return repositories;
    return repositories.filter(
        (repo) =>
            repo.name.toLowerCase().includes(q) ||
            repo.repositoryUrl.toLowerCase().includes(q) ||
            repo.id.toLowerCase().includes(q),
    );
}

export function filterContainers(containers: Containers[], query: string): Containers[] {
    const q = normalizeQuery(query);
    return containers.filter(
        (c) =>
            c.name.toLowerCase().includes(q) ||
            c.image.toLowerCase().includes(q) ||
            c.id.toLowerCase().startsWith(q),
    );
}

export function filterImages(images: Image[], query: string): Image[] {
    const q = normalizeQuery(query);
    return images.filter(
        (img) =>
            img.repoTags?.some((t) => t.toLowerCase().includes(q)) ||
            img.id.toLowerCase().startsWith(q),
    );
}

export function filterVolumes(volumes: Volume[], query: string): Volume[] {
    const q = normalizeQuery(query);
    return volumes.filter((vol) => vol.name.toLowerCase().includes(q));
}

export function filterNetworks(networks: Network[], query: string): Network[] {
    const q = normalizeQuery(query);
    return networks.filter(
        (net) => net.name.toLowerCase().includes(q) || net.id.toLowerCase().startsWith(q),
    );
}
