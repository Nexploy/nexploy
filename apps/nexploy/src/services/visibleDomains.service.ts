import type { Domain } from '@workspace/schemas-zod/repository/domain.schema';
import { getDomains } from '@/services/traefik.service';
import { getUserSession } from '@/services/auth/auth.service';
import { kyDocker } from '@/lib/api/kyDocker';
import { NEXPLOY_LABELS } from '@workspace/shared/nexployLabels';
import { prisma } from '../../prisma/prisma';

type ContainerSummary = { name: string; labels?: Record<string, string> | null };

async function buildContainerRepositoryMap(): Promise<Map<string, string>> {
    try {
        const containers = await kyDocker.get('containers').json<ContainerSummary[]>();
        const map = new Map<string, string>();

        for (const container of containers) {
            const repositoryId = container.labels?.[NEXPLOY_LABELS.repositoryId];
            if (repositoryId) map.set(container.name.replace(/^\//, ''), repositoryId);
        }

        return map;
    } catch {
        return new Map();
    }
}

export async function getVisibleDomains(): Promise<Domain[]> {
    const session = await getUserSession();
    if (!session) return [];

    const domains = await getDomains();
    if (session.user.role === 'admin') return domains;

    const [containerRepositories, memberships] = await Promise.all([
        buildContainerRepositoryMap(),
        prisma.member.findMany({
            where: { userId: session.user.id },
            select: { organizationId: true },
        }),
    ]);

    const allowedOrganizationIds = new Set(memberships.map((member) => member.organizationId));
    if (allowedOrganizationIds.size === 0) return [];

    const repositoryIds = Array.from(new Set(containerRepositories.values()));
    const repositories = await prisma.repository.findMany({
        where: { id: { in: repositoryIds } },
        select: { id: true, organizationId: true },
    });
    const repositoryOrganizations = new Map(
        repositories.map((repository) => [repository.id, repository.organizationId]),
    );

    return domains.filter((domain) => {
        if (!domain.containerName) return false;

        const repositoryId = containerRepositories.get(domain.containerName.replace(/^\//, ''));
        if (!repositoryId) return false;

        const organizationId = repositoryOrganizations.get(repositoryId);
        return !!organizationId && allowedOrganizationIds.has(organizationId);
    });
}
