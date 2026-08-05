import { prisma } from '../../prisma/prisma';
import type { Role } from '@/lib/auth/permissions';
import type { OrgRole } from '@/lib/auth/orgPermissions';
import { auth } from '@/lib/auth/auth';
import { type TestUser, TEST_PASSWORD, loginAs, logout } from './session';

export interface OrgFixture {
    id: string;
    slug: string;
}

export const FIXTURE_USERS = [
    'guest',
    'developer',
    'admin',
    'system',
    'orgOwner',
    'orgAdmin',
    'orgMember',
    'outsider',
] as const;

export type FixtureUserKey = (typeof FIXTURE_USERS)[number];

export interface WorldFixture {
    orgA: OrgFixture;
    orgB: OrgFixture;
    users: Record<FixtureUserKey, TestUser>;
    repositories: {
        inOrgA: string;
        inOrgB: string;
    };
    stages: {
        inOrgA: string;
    };
}

let cachedPasswordHash: string | null = null;

async function testPasswordHash(): Promise<string> {
    if (!cachedPasswordHash) {
        const context = await auth.$context;
        cachedPasswordHash = await context.password.hash(TEST_PASSWORD);
    }

    return cachedPasswordHash;
}

async function createOrganization(slug: string): Promise<OrgFixture> {
    const organization = await prisma.organization.create({
        data: { id: `org-${slug}`, name: slug, slug, createdAt: new Date() },
    });

    return { id: organization.id, slug: organization.slug };
}

export interface CreateUserInput {
    key: string;
    role: Role;
    organizationId?: string | null;
    orgRole?: OrgRole | null;
}

export async function createUser({
    key,
    role,
    organizationId = null,
    orgRole = null,
}: CreateUserInput): Promise<TestUser> {
    const id = `user-${key}`;
    const email = `${key}@nexploy.test`;

    await prisma.user.create({
        data: { id, name: key, email, emailVerified: true, role },
    });

    await prisma.account.create({
        data: {
            id: `account-${key}`,
            accountId: id,
            providerId: 'credential',
            userId: id,
            password: await testPasswordHash(),
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    });

    if (organizationId && orgRole) {
        await prisma.member.create({
            data: {
                id: `member-${key}-${organizationId}`,
                organizationId,
                userId: id,
                role: orgRole,
                createdAt: new Date(),
            },
        });
    }

    return { id, email, name: key, role, organizationId, orgRole };
}

export async function createRepository(options: {
    name: string;
    organizationId: string;
    userId?: string | null;
}): Promise<string> {
    const repository = await prisma.repository.create({
        data: {
            name: options.name,
            repositoryUrl: `https://github.com/nexploy/${options.name}`,
            gitProvider: 'GITHUB',
            gitId: options.name,
            organizationId: options.organizationId,
            userId: options.userId ?? null,
        },
    });

    return repository.id;
}

export async function createStage(options: {
    repositoryId: string;
    name: string;
    isProduction?: boolean;
}): Promise<string> {
    const stage = await prisma.deploymentStage.create({
        data: {
            name: options.name,
            isProduction: options.isProduction ?? false,
            repositoryId: options.repositoryId,
        },
    });

    return stage.id;
}

export async function seedWorld(): Promise<WorldFixture> {
    const orgA = await createOrganization('org-a');
    const orgB = await createOrganization('org-b');

    const users: Record<FixtureUserKey, TestUser> = {
        guest: await createUser({ key: 'guest', role: 'guest' }),
        developer: await createUser({ key: 'developer', role: 'developer' }),
        admin: await createUser({ key: 'admin', role: 'admin' }),
        system: await createUser({ key: 'system', role: 'system' }),

        orgOwner: await createUser({ key: 'org-owner', role: 'developer', organizationId: orgA.id, orgRole: 'owner' }),
        orgAdmin: await createUser({ key: 'org-admin', role: 'developer', organizationId: orgA.id, orgRole: 'admin' }),
        orgMember: await createUser({
            key: 'org-member',
            role: 'developer',
            organizationId: orgA.id,
            orgRole: 'member',
        }),
        outsider: await createUser({ key: 'outsider', role: 'developer', organizationId: orgB.id, orgRole: 'owner' }),
    };

    const repositories = {
        inOrgA: await createRepository({ name: 'repo-a', organizationId: orgA.id, userId: users.orgOwner.id }),
        inOrgB: await createRepository({ name: 'repo-b', organizationId: orgB.id, userId: users.outsider.id }),
    };

    const stages = {
        inOrgA: await createStage({ repositoryId: repositories.inOrgA, name: 'production', isProduction: true }),
    };

    return { orgA, orgB, users, repositories, stages };
}

export { loginAs, logout };
