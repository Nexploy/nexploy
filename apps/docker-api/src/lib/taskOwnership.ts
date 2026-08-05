import { COMPOSE_PROJECT_LABEL, stackOwnerOrganizationId } from '@nexploy/shared/ownership';
import { containersStateManager } from '@/managers/list/containersStateManager';
import { getRepositoryOrganizations } from '@/lib/containerOwnership';

export async function resolveContainersOwner(containerIds: string[]): Promise<string | null> {
    const ids = new Set(containerIds);
    const containers = containersStateManager.getAllStates().filter((container) => ids.has(container.id));

    return stackOwnerOrganizationId(containers, await getRepositoryOrganizations());
}

export async function resolveStackOwner(project: string): Promise<string | null> {
    const containers = containersStateManager
        .getAllStates()
        .filter((container) => container.labels?.[COMPOSE_PROJECT_LABEL] === project);

    return stackOwnerOrganizationId(containers, await getRepositoryOrganizations());
}
