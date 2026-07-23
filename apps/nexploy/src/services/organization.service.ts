import { prisma } from '../../prisma/prisma';

export async function getUserOrganizations(userId: string) {
    const memberships = await prisma.member.findMany({
        where: { userId },
        include: { organization: true },
        orderBy: { createdAt: 'asc' },
    });

    return memberships.map((m) => ({ ...m.organization, role: m.role }));
}

export async function getPendingInvitations(email: string) {
    return prisma.invitation.findMany({
        where: { email, status: 'pending' },
        include: { organization: { select: { id: true, name: true, slug: true, logo: true } } },
        orderBy: { createdAt: 'desc' },
    });
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
    };
}
