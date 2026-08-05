import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { onTaskCancelAction } from '@/actions/tasks/cancelTask.action';
import { disconnectGitAccountAction } from '@/actions/git/disconnectGitAccount.action';
import { onChangeUsernameAction } from '@/actions/auth/changeUsername.action';
import { onSignInAction } from '@/actions/auth/signIn.action';
import { onSetupAction } from '@/actions/auth/setup.action';
import { leaveOrganizationAction } from '@/actions/organization/leaveOrganization.action';
import { acceptInvitationAction } from '@/actions/organization/acceptInvitation.action';
import { rejectInvitationAction } from '@/actions/organization/rejectInvitation.action';
import { GET as listGitAccounts } from '@/app/api/git/accounts/route';
import { NEXPLOY_ORGANIZATION_LABEL } from '@nexploy/shared/ownership';
import { callRoute, FORBIDDEN_MESSAGE, readJson, type ActionResult, type RouteHandler } from '../setup/invoke';
import { mockDocker, mockDockerFallback } from '../setup/dockerMock';
import { allowOnly, describePermissionMatrix } from './permissionMatrix';
import { resetDatabase } from '../setup/db';
import { prisma } from '../../prisma/prisma';
import { createGitAccount, createGitProvider, seedWorld, type WorldFixture } from '../setup/fixtures';
import { loginAs, logout } from '../setup/session';
import { isTestRedirectError } from '../setup/nextMocks';

const ORG_A_TASK = 'task-of-org-a';
const HOST_TASK = 'task-of-the-host';

function mockTasks() {
    mockDockerFallback(() => ({}));

    mockDocker('get', `tasks/${ORG_A_TASK}`, {
        id: ORG_A_TASK,
        kind: 'container-start',
        ownerOrganizationId: 'org-org-a',
        status: 'running',
    });
    mockDocker('get', `tasks/${HOST_TASK}`, {
        id: HOST_TASK,
        kind: 'container-start',
        ownerOrganizationId: null,
        status: 'running',
    });
    mockDocker('get', `container/${ORG_A_TASK}`, {
        Config: { Labels: { [NEXPLOY_ORGANIZATION_LABEL]: 'org-org-a' } },
    });
}

describePermissionMatrix('task ownership', [
    {
        name: 'onTaskCancelAction on a task owned by organization A',
        kind: 'action',
        setup: mockTasks,
        invoke: () => onTaskCancelAction({ taskId: ORG_A_TASK }),
        expected: allowOnly('admin', 'orgOwner', 'orgAdmin', 'orgMember'),
    },
    {
        name: 'onTaskCancelAction on a host-owned task',
        kind: 'action',
        setup: mockTasks,
        invoke: () => onTaskCancelAction({ taskId: HOST_TASK }),
        expected: allowOnly('developer', 'admin', 'orgOwner', 'orgAdmin', 'orgMember', 'outsider'),
    },
]);

describe('self-service endpoints', () => {
    let world: WorldFixture;

    beforeEach(async () => {
        await resetDatabase();
        world = await seedWorld();
        mockTasks();
    });

    afterAll(async () => {
        await resetDatabase();
    });

    it('refuses an anonymous caller on every session-scoped action', async () => {
        logout();

        await expect(disconnectGitAccountAction({ gitProviderId: 'provider-1' } as never)).rejects.toThrow();
        await expect(onTaskCancelAction({ taskId: HOST_TASK })).rejects.toThrow();
        await expect(leaveOrganizationAction({ organizationId: world.orgA.id })).rejects.toThrow();
    });

    it('lists only the git accounts owned by the caller', async () => {
        const gitProviderId = await createGitProvider();
        await createGitAccount({
            userId: world.users.orgOwner.id,
            gitProviderId,
            username: 'org-owner',
        });

        await loginAs(world.users.orgMember);

        const response = await callRoute(listGitAccounts as RouteHandler, {
            url: 'http://localhost:3022/api/git/accounts',
        });
        const body = await readJson<unknown[]>(response);

        expect(response.status).toBe(200);
        expect(body).toEqual([]);
    });

    it('never disconnects a git account owned by somebody else', async () => {
        const gitProviderId = await createGitProvider();
        const accountId = await createGitAccount({
            userId: world.users.orgOwner.id,
            gitProviderId,
            username: 'org-owner',
        });

        await loginAs(world.users.outsider);
        await disconnectGitAccountAction({ gitProviderId } as never).catch(() => undefined);

        const stillThere = await prisma.gitAccount.findUnique({ where: { id: accountId } });

        expect(stillThere).not.toBeNull();
    });

    it('renames only the caller account', async () => {
        await loginAs(world.users.orgMember);

        await onChangeUsernameAction({ newName: 'renamed-by-tests' } as never);

        const caller = await prisma.user.findUnique({ where: { id: world.users.orgMember.id } });
        const other = await prisma.user.findUnique({ where: { id: world.users.orgOwner.id } });

        expect(caller?.name).toBe('renamed-by-tests');
        expect(other?.name).toBe('org-owner');
    });

    it('refuses to rename anything without a session', async () => {
        logout();

        const before = await prisma.user.findUnique({ where: { id: world.users.orgMember.id } });
        await onChangeUsernameAction({ newName: 'renamed-by-anonymous' } as never).catch(() => undefined);
        const after = await prisma.user.findUnique({ where: { id: world.users.orgMember.id } });

        expect(after?.name).toBe(before?.name);
    });

    it('lets a member leave their organization', async () => {
        await loginAs(world.users.orgMember);

        await leaveOrganizationAction({ organizationId: world.orgA.id });

        const membership = await prisma.member.findFirst({
            where: { organizationId: world.orgA.id, userId: world.users.orgMember.id },
        });

        expect(membership).toBeNull();
    });

    it('refuses to let the sole owner leave their organization', async () => {
        await loginAs(world.users.orgOwner);

        const result = (await leaveOrganizationAction({ organizationId: world.orgA.id })) as ActionResult;
        const membership = await prisma.member.findFirst({
            where: { organizationId: world.orgA.id, userId: world.users.orgOwner.id },
        });

        expect(result.serverError).toBe('organization.errors.cannotLeaveAsSoleOwner');
        expect(membership).not.toBeNull();
    });

    it('never lets a user accept an invitation addressed to somebody else', async () => {
        await loginAs(world.users.outsider);

        await acceptInvitationAction({ invitationId: world.invitations.inOrgA }).catch(() => undefined);

        const membership = await prisma.member.findFirst({
            where: { organizationId: world.orgA.id, userId: world.users.outsider.id },
        });
        const invitation = await prisma.invitation.findUnique({ where: { id: world.invitations.inOrgA } });

        expect(membership).toBeNull();
        expect(invitation?.status).toBe('pending');
    });

    it('never lets a user reject an invitation addressed to somebody else', async () => {
        await loginAs(world.users.outsider);

        await rejectInvitationAction({ invitationId: world.invitations.inOrgA }).catch(() => undefined);

        const invitation = await prisma.invitation.findUnique({ where: { id: world.invitations.inOrgA } });

        expect(invitation?.status).toBe('pending');
    });

    it('refuses a sign-in with the wrong password', async () => {
        logout();

        const result = (await onSignInAction({
            email: world.users.admin.email,
            password: 'not-the-password',
        } as never)) as ActionResult;

        expect(result?.serverError).toBeDefined();
    });

    it('refuses the first-run setup once an admin already exists', async () => {
        logout();

        const result = await onSetupAction({
            name: 'second-admin',
            email: 'second-admin@nexploy.test',
            password: 'Password123!',
            confirmPassword: 'Password123!',
        } as never).catch((error) => {
            if (isTestRedirectError(error)) return { data: undefined } as ActionResult;
            throw error;
        });

        const created = await prisma.user.findFirst({ where: { email: 'second-admin@nexploy.test' } });

        expect(created, 'setup must not create a second admin').toBeNull();
        expect((result as ActionResult)?.data).toBeUndefined();
    });

    it('cancels nothing when the caller may not manage the task', async () => {
        await loginAs(world.users.guest);

        const result = (await onTaskCancelAction({ taskId: HOST_TASK })) as ActionResult;

        expect(result.serverError).toBe(FORBIDDEN_MESSAGE);
    });
});
