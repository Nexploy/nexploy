import { kyNexploy } from '@/lib/kyNexploy';
import { logger } from '@/utils/logger';
import { getCurrentActor } from '@/lib/actorContext';
import {
    filterVisibleToViewer,
    isVisibleToViewer,
    type OwnedResource,
    type OwnershipLabels,
    type RepositoryOrganizations,
    type Viewer,
    withResolvedOwner,
} from '@nexploy/shared/ownership';

const CACHE_TTL_MS = 30_000;

let cachedMap: RepositoryOrganizations = {};
let cacheExpiresAt = 0;
let inFlight: Promise<RepositoryOrganizations> | null = null;

async function fetchRepositoryOrganizations(): Promise<RepositoryOrganizations> {
    try {
        const map = await kyNexploy
            .get('internal/repository-organizations', {
                headers: { 'x-internal-secret': process.env.ENCRYPTION_KEY ?? '' },
            })
            .json<RepositoryOrganizations>();

        cachedMap = map;
        cacheExpiresAt = Date.now() + CACHE_TTL_MS;
        return cachedMap;
    } catch (error) {
        logger.warn({ error }, 'Could not refresh repository ownership map, serving the previous one');
        return cachedMap;
    }
}

export async function getRepositoryOrganizations(): Promise<RepositoryOrganizations> {
    if (cacheExpiresAt > Date.now()) return cachedMap;

    inFlight ??= fetchRepositoryOrganizations().finally(() => {
        inFlight = null;
    });

    return inFlight;
}

export function currentViewer(): Viewer {
    const actor = getCurrentActor();
    return {
        role: actor.source === 'system' ? 'system' : actor.role,
        organizationId: actor.organizationId,
    };
}

export async function filterVisibleContainers<T extends OwnedResource>(
    containers: T[],
    viewer: Viewer = currentViewer(),
): Promise<T[]> {
    const repositoryOrganizations = await getRepositoryOrganizations();

    return filterVisibleToViewer(containers, viewer, repositoryOrganizations).map((container) =>
        withResolvedOwner(container, repositoryOrganizations),
    );
}

export async function isContainerVisible(labels: OwnershipLabels): Promise<boolean> {
    return isVisibleToViewer(labels, currentViewer(), await getRepositoryOrganizations());
}

export async function resolveContainerOwner<T extends OwnedResource>(container: T): Promise<T> {
    return withResolvedOwner(container, await getRepositoryOrganizations());
}
