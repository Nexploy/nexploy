import { prisma } from '../../../prisma/prisma';
import { kyDocker } from '@/lib/api/kyDocker';
import { NEXPLOY_LABELS } from '@/lib/nexployLabels';
import { getDomains } from '@/services/traefik.service';

export async function resolveOrganizationIdForRepository(repositoryId: string): Promise<string | null> {
    const repo = await prisma.repository.findUnique({
        where: { id: repositoryId },
        select: { organizationId: true },
    });
    return repo?.organizationId ?? null;
}

export async function resolveOrganizationIdForBuild(buildId: string): Promise<string | null> {
    const build = await prisma.build.findUnique({
        where: { id: buildId },
        select: { repository: { select: { organizationId: true } } },
    });
    return build?.repository.organizationId ?? null;
}

export async function resolveOrganizationIdForStage(stageId: string): Promise<string | null> {
    const stage = await prisma.deploymentStage.findUnique({
        where: { id: stageId },
        select: { repository: { select: { organizationId: true } } },
    });
    return stage?.repository.organizationId ?? null;
}

export async function resolveOrganizationIdForContainer(containerId: string): Promise<string | null> {
    try {
        const info = await kyDocker
            .get(`container/${containerId}`)
            .json<{ Config?: { Labels?: Record<string, string> } }>();
        const repositoryId = info.Config?.Labels?.[NEXPLOY_LABELS.repositoryId];
        if (!repositoryId) return null;
        return resolveOrganizationIdForRepository(repositoryId);
    } catch {
        return null;
    }
}

export async function resolveOrganizationIdForContainers(containerIds: string[]): Promise<string[] | null> {
    if (containerIds.length === 0) return null;
    const orgIds = await Promise.all(containerIds.map(resolveOrganizationIdForContainer));
    if (orgIds.some((id) => id === null)) return null;
    const unique = new Set(orgIds as string[]);
    return Array.from(unique);
}

export async function getCallerOrgRole(userId: string, organizationId: string): Promise<string | null> {
    const member = await prisma.member.findFirst({
        where: { organizationId, userId },
        select: { role: true },
    });
    return member?.role ?? null;
}

export type OrgResolver = (
    clientInput: unknown,
    bindArgsClientInputs?: readonly unknown[],
) => Promise<string | string[] | null>;

export const byRepositoryId: OrgResolver = (input) =>
    resolveOrganizationIdForRepository((input as { repositoryId: string }).repositoryId);

export const byBuildId: OrgResolver = (input) =>
    resolveOrganizationIdForBuild((input as { buildId: string }).buildId);

export const byStageId: OrgResolver = (input) =>
    resolveOrganizationIdForStage((input as { stageId: string }).stageId);

export const byStageEntityId: OrgResolver = (input) =>
    resolveOrganizationIdForStage((input as { id: string }).id);

export const byBoundRepositoryId: OrgResolver = (_input, bindArgsClientInputs) =>
    resolveOrganizationIdForRepository(bindArgsClientInputs?.[0] as string);

export const byContainerIds: OrgResolver = (input) => {
    const raw = input as { containerIds?: string[]; containerId?: string };
    const containerIds = raw.containerIds ?? (raw.containerId ? [raw.containerId] : []);
    return resolveOrganizationIdForContainers(containerIds);
};

export type RequestOrgResolver = (request: Request) => Promise<string | string[] | null>;

export const byRepositoryIdParam: RequestOrgResolver = (request) => {
    const match = new URL(request.url).pathname.match(/\/repositories\/([^/]+)/);
    return match?.[1] ? resolveOrganizationIdForRepository(match[1]) : Promise.resolve(null);
};

export const byBuildIdParam: RequestOrgResolver = (request) => {
    const match = new URL(request.url).pathname.match(/\/builds\/([^/]+)/);
    return match?.[1] ? resolveOrganizationIdForBuild(match[1]) : Promise.resolve(null);
};

export const byStageIdParam: RequestOrgResolver = (request) => {
    const match = new URL(request.url).pathname.match(/\/stages\/([^/]+)/);
    return match?.[1] ? resolveOrganizationIdForStage(match[1]) : Promise.resolve(null);
};

export const byDomainContainerName: OrgResolver = (input) => {
    const raw = input as { domain?: { containerName?: string } };
    const containerName = raw.domain?.containerName;
    return containerName ? resolveOrganizationIdForContainer(containerName) : Promise.resolve(null);
};

export const byDomainId: OrgResolver = async (input) => {
    const raw = input as { domainId?: string };
    if (!raw.domainId) return null;
    const domains = await getDomains();
    const domain = domains.find((d) => d.id === raw.domainId);
    if (!domain?.containerName) return null;
    return resolveOrganizationIdForContainer(domain.containerName);
};
