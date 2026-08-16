import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { banUser } from '@/actions/user/banUser.action';
import { deleteUser } from '@/actions/user/deleteUser.action';
import { updateUserRole } from '@/actions/user/updateUserRole.action';
import { purgeActivityLogsAction } from '@/actions/admin/activity/purgeActivityLogs.action';
import { updateActivityRetentionAction } from '@/actions/admin/activity/updateActivityRetention.action';
import { updateCleanupSettingsAction } from '@/actions/admin/cleanup/updateCleanupSettings.action';
import { GET as getActivity } from '@/app/api/admin/activity/route';
import { GET as exportActivity } from '@/app/api/admin/activity/export/route';
import { GET as getVersion } from '@/app/api/admin/version/route';
import { callRoute, FORBIDDEN_MESSAGE, readJson, type ActionResult, type RouteHandler } from '../setup/invoke';
import { allowOnly, describePermissionMatrix } from './permissionMatrix';
import { resetDatabase } from '../setup/db';
import { prisma } from '../../prisma/prisma';
import { seedWorld, type WorldFixture } from '../setup/fixtures';
import { loginAs } from '../setup/session';

describePermissionMatrix('user administration actions', [
    {
        name: 'banUser',
        kind: 'action',
        invoke: (world) => banUser({ userId: world.users.orgMember.id, action: 'ban', reason: 'testing' }),
        expected: allowOnly('admin'),
    },
    {
        name: 'deleteUser',
        kind: 'action',
        invoke: (world) => deleteUser({ userId: world.users.orgMember.id }),
        expected: allowOnly('admin'),
    },
    {
        name: 'updateUserRole',
        kind: 'action',
        invoke: (world) => updateUserRole({ userId: world.users.orgMember.id, role: 'admin' }),
        expected: allowOnly('admin'),
    },
]);

describePermissionMatrix('instance administration actions', [
    {
        name: 'purgeActivityLogsAction',
        kind: 'action',
        invoke: () => purgeActivityLogsAction({}),
        expected: allowOnly('admin'),
    },
    {
        name: 'updateActivityRetentionAction',
        kind: 'action',
        invoke: () => updateActivityRetentionAction({ retentionDays: 30 }),
        expected: allowOnly('admin'),
    },
    {
        name: 'updateCleanupSettingsAction',
        kind: 'action',
        invoke: () => updateCleanupSettingsAction({ enabled: false } as never),
        expected: allowOnly('admin'),
    },
]);

describePermissionMatrix('admin API routes', [
    {
        name: 'GET /api/admin/activity',
        kind: 'route',
        invoke: () =>
            callRoute(getActivity as RouteHandler, { url: 'http://localhost:3022/api/admin/activity?page=1' }),
        expected: allowOnly('admin'),
    },
    {
        name: 'GET /api/admin/activity/export',
        kind: 'route',
        invoke: () =>
            callRoute(exportActivity as RouteHandler, {
                url: 'http://localhost:3022/api/admin/activity/export?format=csv',
            }),
        expected: allowOnly('admin'),
    },
    {
        name: 'GET /api/admin/version',
        kind: 'route',
        invoke: () => callRoute(getVersion as RouteHandler, { url: 'http://localhost:3022/api/admin/version' }),
        expected: allowOnly('developer', 'admin', 'orgOwner', 'orgAdmin', 'orgMember', 'outsider'),
    },
]);

describe('user administration effects', () => {
    let world: WorldFixture;

    beforeEach(async () => {
        await resetDatabase();
        world = await seedWorld();
    });

    afterAll(async () => {
        await resetDatabase();
    });

    it('bans the target user when an admin asks for it', async () => {
        await loginAs(world.users.admin);

        await banUser({ userId: world.users.orgMember.id, action: 'ban', reason: 'testing' });

        const target = await prisma.user.findUnique({ where: { id: world.users.orgMember.id } });

        expect(target?.banned).toBe(true);
        expect(target?.banReason).toBe('testing');
    });

    it('refuses to ban the system user', async () => {
        await loginAs(world.users.admin);

        const result = (await banUser({
            userId: world.users.system.id,
            action: 'ban',
            reason: 'testing',
        })) as ActionResult;

        const target = await prisma.user.findUnique({ where: { id: world.users.system.id } });

        expect(result.serverError).toBe('admin.errors.cannotModifySystemUser');
        expect(target?.banned).toBeFalsy();
    });

    it('refuses to let an admin change their own role', async () => {
        await loginAs(world.users.admin);

        const result = (await updateUserRole({ userId: world.users.admin.id, role: 'guest' })) as ActionResult;
        const target = await prisma.user.findUnique({ where: { id: world.users.admin.id } });

        expect(result.serverError).toBe('admin.errors.cannotChangeOwnRole');
        expect(target?.role).toBe('admin');
    });

    it('refuses to let an admin delete their own account', async () => {
        await loginAs(world.users.admin);

        const result = (await deleteUser({ userId: world.users.admin.id })) as ActionResult;
        const target = await prisma.user.findUnique({ where: { id: world.users.admin.id } });

        expect(result.serverError).toBe('admin.errors.cannotDeleteOwnAccount');
        expect(target).not.toBeNull();
    });

    it('leaves the target untouched when a developer tries to escalate a role', async () => {
        await loginAs(world.users.orgOwner);

        const result = (await updateUserRole({ userId: world.users.orgMember.id, role: 'admin' })) as ActionResult;
        const target = await prisma.user.findUnique({ where: { id: world.users.orgMember.id } });

        expect(result.serverError).toBe(FORBIDDEN_MESSAGE);
        expect(target?.role).toBe('developer');
    });
});

describe('activity log route payloads', () => {
    let world: WorldFixture;

    beforeEach(async () => {
        await resetDatabase();
        world = await seedWorld();
    });

    afterAll(async () => {
        await resetDatabase();
    });

    it('returns the denied attempts an admin needs to audit', async () => {
        await loginAs(world.users.orgMember);
        await updateUserRole({ userId: world.users.orgOwner.id, role: 'guest' });

        await loginAs(world.users.admin);
        const response = await callRoute(getActivity as RouteHandler, {
            url: 'http://localhost:3022/api/admin/activity?page=1&status=DENIED',
        });
        const body = await readJson<{
            entries: { name: string; status: string; actorId: string | null }[];
            total: number;
        }>(response);

        expect(response.status).toBe(200);
        expect(body.entries.some((entry) => entry.name === 'user.updateRole' && entry.status === 'DENIED')).toBe(true);
        expect(body.entries.every((entry) => entry.status === 'DENIED')).toBe(true);
    });

    it('streams a csv export of the filtered entries', async () => {
        await loginAs(world.users.orgMember);
        await updateUserRole({ userId: world.users.orgOwner.id, role: 'guest' });

        await loginAs(world.users.admin);
        const response = await callRoute(exportActivity as RouteHandler, {
            url: 'http://localhost:3022/api/admin/activity/export?format=csv&status=DENIED',
        });
        const body = await response.text();
        const [header, ...rows] = body.replace('﻿', '').trim().split('\r\n');

        expect(response.status).toBe(200);
        expect(response.headers.get('Content-Type')).toContain('text/csv');
        expect(response.headers.get('Content-Disposition')).toContain('attachment; filename="nexploy-activity-');
        expect(header).toContain('id,createdAt,name');
        expect(rows.some((row) => row.includes('user.updateRole') && row.includes('DENIED'))).toBe(true);
    });

    it('pseudonymizes the personal data of every exported entry', async () => {
        await loginAs(world.users.orgMember);
        await updateUserRole({ userId: world.users.orgOwner.id, role: 'guest' });

        await loginAs(world.users.admin);
        const response = await callRoute(exportActivity as RouteHandler, {
            url: 'http://localhost:3022/api/admin/activity/export?format=ndjson&status=DENIED',
        });
        const entries = (await response.text())
            .trim()
            .split('\n')
            .map((line) => JSON.parse(line) as { actorId: string | null; actorEmail: string | null });

        expect(entries.length).toBeGreaterThan(0);
        expect(entries.every((entry) => entry.actorId === null || entry.actorId.startsWith('anon_'))).toBe(true);
        expect(entries.every((entry) => entry.actorEmail === null || /^.\*\*\*@/.test(entry.actorEmail))).toBe(true);
        expect(entries.some((entry) => entry.actorEmail === world.users.orgMember.email)).toBe(false);
    });

    it('records the export itself in the audit trail', async () => {
        await loginAs(world.users.admin);

        await callRoute(exportActivity as RouteHandler, {
            url: 'http://localhost:3022/api/admin/activity/export?format=csv',
        });

        const record = await prisma.activityLog.findFirst({
            where: { name: 'activity.export' },
            orderBy: { createdAt: 'desc' },
        });

        expect(record?.status).toBe('SUCCESS');
        expect((record?.metadata as { format?: string } | null)?.format).toBe('csv');
    });

    it('exports one json object per line in ndjson', async () => {
        await loginAs(world.users.orgMember);
        await updateUserRole({ userId: world.users.orgOwner.id, role: 'guest' });

        await loginAs(world.users.admin);
        const response = await callRoute(exportActivity as RouteHandler, {
            url: 'http://localhost:3022/api/admin/activity/export?format=ndjson&status=DENIED',
        });
        const lines = (await response.text()).trim().split('\n');
        const entries = lines.map((line) => JSON.parse(line) as { status: string; name: string });

        expect(entries.length).toBeGreaterThan(0);
        expect(entries.every((entry) => entry.status === 'DENIED')).toBe(true);
    });
});
