import { prisma } from '../../../prisma/prisma';
import { NEXPLOY_LABELS } from '@/lib/nexployLabels';

export async function resolveOrganizationIdForContainerId(containerId: string): Promise<string | null> {
    try {
        const res = await fetch(`${process.env.DOCKER_API_URL}/api/container/${containerId}`, {
            headers: process.env.NEXPLOY_API_KEY
                ? { Authorization: `Bearer ${process.env.NEXPLOY_API_KEY}` }
                : undefined,
        });
        if (!res.ok) return null;

        const info = (await res.json()) as { Config?: { Labels?: Record<string, string> } };
        const repositoryId = info.Config?.Labels?.[NEXPLOY_LABELS.repositoryId];
        if (!repositoryId) return null;

        const repository = await prisma.repository.findUnique({
            where: { id: repositoryId },
            select: { organizationId: true },
        });
        return repository?.organizationId ?? null;
    } catch {
        return null;
    }
}

export async function getCallerOrgRoleForProxy(
    userId: string,
    organizationId: string,
): Promise<string | null> {
    const member = await prisma.member.findFirst({
        where: { organizationId, userId },
        select: { role: true },
    });
    return member?.role ?? null;
}
