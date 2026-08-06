import { randomBytes } from 'node:crypto';
import { prisma } from '../../prisma/prisma';
import type { InvitableUser, UserOrganization } from '@workspace/typescript-interface/organization/organization';
import { teardownRepositoryWebhook } from '@/services/webhook/repoWebhook.service';

const PERSONAL_ORGANIZATION_SLUG_PREFIX = 'personal-';
const ORGANIZATION_SLUG_MAX_LENGTH = 100;
const ORGANIZATION_SLUG_SUFFIX_BYTES = 5;

export function personalOrganizationSlug(userId: string) {
    return `${PERSONAL_ORGANIZATION_SLUG_PREFIX}${userId}`;
}

export function generateOrganizationSlug(name: string) {
    const suffix = randomBytes(ORGANIZATION_SLUG_SUFFIX_BYTES).toString('hex');

    const base = name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .slice(0, ORGANIZATION_SLUG_MAX_LENGTH - suffix.length - 1);

    return base ? `${base}-${suffix}` : `org-${suffix}`;
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

export async function teardownPersonalOrganizationRepositories(userId: string) {
    const repositories = await prisma.repository.findMany({
        where: { organization: { slug: personalOrganizationSlug(userId) } },
        select: { id: true },
    });

    for (const { id } of repositories) {
        try {
            await teardownRepositoryWebhook(id);
        } catch (error) {
            console.error(`[AUTH] Failed to tear down webhook for repository ${id} of deleted user ${userId}`, error);
        }
    }
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

const INVITABLE_USERS_SEARCH_LIMIT = 8;
const NON_INVITABLE_USER_ROLES = ['system'];

export async function searchInvitableUsers(organizationId: string, query: string) {
    const likePattern = `%${query.trim().replace(/[\\%_]/g, '\\$&')}%`;

    return prisma.$queryRaw<InvitableUser[]>`
        SELECT u."id", u."name", u."email", u."image"
        FROM "user" u
        WHERE u."banned" IS NOT TRUE
          AND (u."role" IS NULL OR NOT (u."role" = ANY (${NON_INVITABLE_USER_ROLES})))
          AND NOT EXISTS (
              SELECT 1 FROM "member" m
              WHERE m."organizationId" = ${organizationId} AND m."userId" = u."id"
          )
          AND NOT EXISTS (
              SELECT 1 FROM "invitation" i
              WHERE i."organizationId" = ${organizationId} AND i."status" = 'pending' AND i."email" = u."email"
          )
          AND (
              unaccent(u."name") ILIKE unaccent(${likePattern})
              OR unaccent(u."email") ILIKE unaccent(${likePattern})
          )
        ORDER BY u."name" ASC
        LIMIT ${INVITABLE_USERS_SEARCH_LIMIT}
    `;
}

export async function getOrganizationDetail(organizationId: string, userId: string, isGlobalAdmin: boolean) {
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
