import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { inviteMemberAction } from '@/actions/organization/inviteMember.action';
import { cancelInvitationAction } from '@/actions/organization/cancelInvitation.action';
import { removeMemberAction } from '@/actions/organization/removeMember.action';
import { updateMemberRoleAction } from '@/actions/organization/updateMemberRole.action';
import { updateOrganizationAction } from '@/actions/organization/updateOrganization.action';
import { deleteOrganizationAction } from '@/actions/organization/deleteOrganization.action';
import { createOrganizationAction } from '@/actions/organization/createOrganization.action';
import { setActiveOrganizationAction } from '@/actions/organization/setActiveOrganization.action';
import { GET as listOrganizations } from '@/app/api/organizations/route';
import { GET as listMembers } from '@/app/api/organizations/[organizationId]/members/route';
import { GET as searchInvitableUsers } from '@/app/api/organizations/[organizationId]/members/search-users/route';
import { callRoute, readJson, type ActionResult, type RouteHandler } from '../setup/invoke';
import { allowOnly, describePermissionMatrix, EVERY_ROLE } from './permissionMatrix';
import { resetDatabase } from '../setup/db';
import { prisma } from '../../prisma/prisma';
import { seedWorld, type WorldFixture } from '../setup/fixtures';
import { loginAs } from '../setup/session';

const NOT_FOUND = 'organization.errors.notFound';
const ORG_A_ADMINS = allowOnly('admin', 'orgOwner', 'orgAdmin');

describePermissionMatrix('organization membership actions', [
    {
        name: 'inviteMemberAction',
        kind: 'action',
        denyMessage: NOT_FOUND,
        invoke: (world) =>
            inviteMemberAction({
                organizationId: world.orgA.id,
                email: world.users.developer.email,
                role: 'member',
            }),
        expected: ORG_A_ADMINS,
    },
    {
        name: 'cancelInvitationAction',
        kind: 'action',
        denyMessage: NOT_FOUND,
        invoke: (world) => cancelInvitationAction({ invitationId: world.invitations.inOrgA }),
        expected: ORG_A_ADMINS,
    },
    {
        name: 'removeMemberAction',
        kind: 'action',
        denyMessage: NOT_FOUND,
        invoke: (world) =>
            removeMemberAction({
                organizationId: world.orgA.id,
                memberIdOrEmail: world.users.orgMember.email,
            }),
        expected: ORG_A_ADMINS,
    },
    {
        name: 'updateMemberRoleAction',
        kind: 'action',
        denyMessage: NOT_FOUND,
        invoke: (world) =>
            updateMemberRoleAction({
                organizationId: world.orgA.id,
                memberId: `member-org-member-${world.orgA.id}`,
                role: 'admin',
            }),
        expected: allowOnly('admin', 'orgOwner'),
    },
    {
        name: 'updateOrganizationAction',
        kind: 'action',
        denyMessage: NOT_FOUND,
        invoke: (world) => updateOrganizationAction({ organizationId: world.orgA.id, name: 'renamed' }),
        expected: ORG_A_ADMINS,
    },
    {
        name: 'deleteOrganizationAction',
        kind: 'action',
        denyMessage: NOT_FOUND,
        invoke: (world) => deleteOrganizationAction({ organizationId: world.orgA.id }),
        expected: allowOnly('admin', 'orgOwner'),
    },
]);

describePermissionMatrix('organization read endpoints', [
    {
        name: 'GET /api/organizations',
        kind: 'route',
        invoke: () => callRoute(listOrganizations as RouteHandler, { url: 'http://localhost:3022/api/organizations' }),
        expected: EVERY_ROLE,
    },
    {
        name: 'GET /api/organizations/[organizationId]/members',
        kind: 'route',
        invoke: (world) =>
            callRoute(listMembers as RouteHandler, {
                url: `http://localhost:3022/api/organizations/${world.orgA.id}/members`,
                params: { organizationId: world.orgA.id },
            }),
        expected: EVERY_ROLE,
    },
    {
        name: 'GET /api/organizations/[organizationId]/members/search-users',
        kind: 'route',
        invoke: (world) =>
            callRoute(searchInvitableUsers as RouteHandler, {
                url: `http://localhost:3022/api/organizations/${world.orgA.id}/members/search-users?q=`,
                params: { organizationId: world.orgA.id },
            }),
        expected: EVERY_ROLE,
    },
]);

describe('organization behaviour', () => {
    let world: WorldFixture;

    beforeEach(async () => {
        await resetDatabase();
        world = await seedWorld();
    });

    afterAll(async () => {
        await resetDatabase();
    });

    it('lists only the organizations the caller belongs to', async () => {
        await loginAs(world.users.orgMember);

        const response = await callRoute(listOrganizations as RouteHandler, {
            url: 'http://localhost:3022/api/organizations',
        });
        const body = await readJson<{ id: string }[]>(response);

        expect(response.status).toBe(200);
        expect(body.map((organization) => organization.id)).toEqual([world.orgA.id]);
    });

    it('never lists an organization the caller left out of', async () => {
        await loginAs(world.users.outsider);

        const response = await callRoute(listOrganizations as RouteHandler, {
            url: 'http://localhost:3022/api/organizations',
        });
        const body = await readJson<{ id: string }[]>(response);

        expect(body.map((organization) => organization.id)).not.toContain(world.orgA.id);
    });

    it('refuses to expose the members of an organization the caller is not in', async () => {
        await loginAs(world.users.outsider);

        const response = await callRoute(listMembers as RouteHandler, {
            url: `http://localhost:3022/api/organizations/${world.orgA.id}/members`,
            params: { organizationId: world.orgA.id },
        });
        const body = await readJson<unknown>(response);

        expect(Array.isArray(body) ? body : []).toEqual([]);
    });

    it('lets an organization admin search invitable users', async () => {
        await loginAs(world.users.orgAdmin);

        const response = await callRoute(searchInvitableUsers as RouteHandler, {
            url: `http://localhost:3022/api/organizations/${world.orgA.id}/members/search-users?q=`,
            params: { organizationId: world.orgA.id },
        });

        expect(response.status).toBe(200);
        expect(Array.isArray(await readJson<unknown>(response))).toBe(true);
    });

    it('hides the invitable users from a plain member', async () => {
        await loginAs(world.users.orgMember);

        const response = await callRoute(searchInvitableUsers as RouteHandler, {
            url: `http://localhost:3022/api/organizations/${world.orgA.id}/members/search-users?q=`,
            params: { organizationId: world.orgA.id },
        });

        expect(response.status).toBe(404);
    });

    it('hides the invitable users from an outsider', async () => {
        await loginAs(world.users.outsider);

        const response = await callRoute(searchInvitableUsers as RouteHandler, {
            url: `http://localhost:3022/api/organizations/${world.orgA.id}/members/search-users?q=`,
            params: { organizationId: world.orgA.id },
        });

        expect(response.status).toBe(404);
    });

    it('lets an organization admin invite a member', async () => {
        await loginAs(world.users.orgAdmin);

        await inviteMemberAction({
            organizationId: world.orgA.id,
            email: world.users.guest.email,
            role: 'member',
        });

        const invitation = await prisma.invitation.findFirst({
            where: { organizationId: world.orgA.id, email: world.users.guest.email },
        });

        expect(invitation).not.toBeNull();
    });

    it('creates no invitation when a plain member tries to invite', async () => {
        await loginAs(world.users.orgMember);

        const result = (await inviteMemberAction({
            organizationId: world.orgA.id,
            email: world.users.guest.email,
            role: 'member',
        })) as ActionResult;

        const invitation = await prisma.invitation.findFirst({
            where: { organizationId: world.orgA.id, email: world.users.guest.email },
        });

        expect(result.serverError).toBe(NOT_FOUND);
        expect(invitation).toBeNull();
    });

    it('leaves the membership untouched when an outsider tries to remove a member', async () => {
        await loginAs(world.users.outsider);

        const result = (await removeMemberAction({
            organizationId: world.orgA.id,
            memberIdOrEmail: world.users.orgMember.email,
        })) as ActionResult;

        const membership = await prisma.member.findFirst({
            where: { organizationId: world.orgA.id, userId: world.users.orgMember.id },
        });

        expect(result.serverError).toBe(NOT_FOUND);
        expect(membership).not.toBeNull();
    });

    it('refuses to delete an organization that still owns repositories', async () => {
        await loginAs(world.users.orgOwner);

        const result = (await deleteOrganizationAction({ organizationId: world.orgA.id })) as ActionResult;
        const organization = await prisma.organization.findUnique({ where: { id: world.orgA.id } });

        expect(result.serverError).toBe('organization.errors.hasRepositories');
        expect(organization).not.toBeNull();
    });

    it('refuses to switch the active organization to one the caller is not in', async () => {
        await loginAs(world.users.outsider);

        await setActiveOrganizationAction({ organizationId: world.orgA.id });

        const session = await prisma.session.findFirst({
            where: { userId: world.users.outsider.id },
            orderBy: { createdAt: 'desc' },
        });

        expect(session?.activeOrganizationId).not.toBe(world.orgA.id);
    });

    it('refuses organization creation to a guest', async () => {
        await loginAs(world.users.guest);

        await createOrganizationAction({ name: 'guest-organization' });

        const organization = await prisma.organization.findFirst({ where: { name: 'guest-organization' } });

        expect(organization).toBeNull();
    });

    it('lets a developer create an organization', async () => {
        await loginAs(world.users.developer);

        await createOrganizationAction({ name: 'developer-organization' });

        const organization = await prisma.organization.findFirst({ where: { name: 'developer-organization' } });

        expect(organization).not.toBeNull();
    });
});
