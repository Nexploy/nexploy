import { prisma } from '../../prisma/prisma';
import type { UserOrganization } from '@workspace/typescript-interface/organization/organization';

const PERSONAL_ORGANIZATION_SLUG_PREFIX = 'personal-';

export function personalOrganizationSlug(userId: string) {
    return `${PERSONAL_ORGANIZATION_SLUG_PREFIX}${userId}`;
}

export async function isPersonalOrganizationSlug(slug: string) {
    if (!slug.startsWith(PERSONAL_ORGANIZATION_SLUG_PREFIX)) return false;

    const ownerId = slug.slice(PERSONAL_ORGANIZATION_SLUG_PREFIX.length);

    return (await prisma.user.count({ where: { id: ownerId } })) > 0;
}

export async function isPersonalOrganization(organizationId: string) {
    const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { slug: true },
    });

    return organization ? isPersonalOrganizationSlug(organization.slug) : false;
}

export async function getUserOrganizations(userId: string): Promise<UserOrganization[]> {
    const memberships = await prisma.member.findMany({
        where: { userId },
        include: {
            organization: {
                include: { members: { where: { role: 'owner' }, select: { id: true } } },
            },
        },
        orderBy: { createdAt: 'asc' },
    });

    return memberships.map(({ organization, role }) => ({
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        logo: organization.logo,
        role,
        canLeave: role !== 'owner' || organization.members.length > 1,
        isPersonal: organization.slug === personalOrganizationSlug(userId),
    }));
}

export async function countOrganizationOwners(organizationId: string) {
    return prisma.member.count({ where: { organizationId, role: 'owner' } });
}

export async function isSoleOwner(organizationId: string) {
    return (await countOrganizationOwners(organizationId)) <= 1;
}

export async function getOldestOrganizationId(userId: string) {
    const membership = await prisma.member.findFirst({
        where: { userId },
        select: { organizationId: true },
        orderBy: { createdAt: 'asc' },
    });

    return membership?.organizationId ?? null;
}

export async function getPendingInvitations(email: string) {
    try {
        return prisma.invitation.findMany({
            where: { email, status: 'pending' },
            include: {
                organization: { select: { id: true, name: true, slug: true, logo: true } },
                user: { select: { email: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    } catch (error) {
        throw new Error('Failed to fetch pending invitations');
    }
}

export async function getOrganizationDetail(
    organizationId: string,
    userId: string,
    isGlobalAdmin: boolean,
) {
    const caller = await prisma.member.findFirst({
        where: { organizationId, userId },
        select: { role: true },
    });

    if (!caller && !isGlobalAdmin) {
        return null;
    }

    const [organization, members, invitations] = await Promise.all([
        prisma.organization.findUnique({ where: { id: organizationId } }),
        prisma.member.findMany({
            where: { organizationId },
            include: { user: { select: { id: true, name: true, email: true, image: true } } },
            orderBy: { createdAt: 'asc' },
        }),
        prisma.invitation.findMany({
            where: { organizationId, status: 'pending' },
            orderBy: { createdAt: 'desc' },
        }),
    ]);

    if (!organization) return null;

    return {
        organization,
        members,
        invitations,
        callerRole: caller?.role ?? (isGlobalAdmin ? 'admin' : null),
        isPersonal: await isPersonalOrganizationSlug(organization.slug),
    };
}
