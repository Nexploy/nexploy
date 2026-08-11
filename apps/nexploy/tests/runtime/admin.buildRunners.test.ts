import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createBuildRunnerAction } from '@/actions/admin/buildRunner/createBuildRunner.action';
import { updateBuildRunnerAction } from '@/actions/admin/buildRunner/updateBuildRunner.action';
import { deleteBuildRunnerAction } from '@/actions/admin/buildRunner/deleteBuildRunner.action';
import { regenerateBuildRunnerTokenAction } from '@/actions/admin/buildRunner/regenerateBuildRunnerToken.action';
import { GET as listBuildRunners } from '@/app/api/build-runners/route';
import {
    createBuildRunner,
    hashToken,
    regenerateBuildRunnerToken,
    updateBuildRunner,
    verifyBuildRunnerToken,
} from '@/services/buildRunner.service';
import { callRoute, type RouteHandler } from '../setup/invoke';
import { ADMIN_ONLY, describePermissionMatrix } from './permissionMatrix';
import { resetDatabase } from '../setup/db';
import { prisma } from '../../prisma/prisma';
import { seedWorld, type WorldFixture } from '../setup/fixtures';
import { loginAs } from '../setup/session';

const MISSING_RUNNER_ID = 'runner_does_not_exist';

describePermissionMatrix('build runner endpoints', [
    {
        name: 'createBuildRunnerAction',
        kind: 'action',
        invoke: () =>
            createBuildRunnerAction({
                name: `runner-${Math.random().toString(36).slice(2, 8)}`,
                description: '',
                labels: 'heavy',
                maxConcurrency: 2,
            }),
        expected: ADMIN_ONLY,
    },
    {
        name: 'updateBuildRunnerAction',
        kind: 'action',
        invoke: () =>
            updateBuildRunnerAction({
                id: MISSING_RUNNER_ID,
                name: 'runner-1',
                description: '',
                labels: '',
                maxConcurrency: 2,
                enabled: true,
            }),
        expected: ADMIN_ONLY,
    },
    {
        name: 'regenerateBuildRunnerTokenAction',
        kind: 'action',
        invoke: () => regenerateBuildRunnerTokenAction({ id: MISSING_RUNNER_ID }),
        expected: ADMIN_ONLY,
    },
    {
        name: 'deleteBuildRunnerAction',
        kind: 'action',
        invoke: () => deleteBuildRunnerAction({ id: MISSING_RUNNER_ID }),
        expected: ADMIN_ONLY,
    },
    {
        name: 'GET /api/build-runners',
        kind: 'route',
        invoke: () => callRoute(listBuildRunners as RouteHandler, { url: 'http://localhost:3022/api/build-runners' }),
        expected: ADMIN_ONLY,
    },
]);

describe('build runner effects', () => {
    let world: WorldFixture;

    beforeEach(async () => {
        await resetDatabase();
        world = await seedWorld();
        await loginAs(world.users.admin);
    });

    afterAll(async () => {
        await resetDatabase();
    });

    it('returns the token once and stores only its hash', async () => {
        const { token } = await createBuildRunner(
            { name: 'runner-alpha', description: 'Frankfurt box', labels: 'heavy, eu-west', maxConcurrency: 4 },
            world.users.admin.id,
        );

        expect(token).toMatch(/^nxr_[0-9a-f]{64}$/);

        const stored = await prisma.buildRunner.findUniqueOrThrow({ where: { name: 'runner-alpha' } });

        expect(stored.tokenHash).toBe(hashToken(token));
        expect(stored.tokenHash).not.toBe(token);
        expect(stored.tokenPrefix).toBe(token.slice(0, 12));
        expect(stored.labels).toEqual(['heavy', 'eu-west']);
        expect(stored.maxConcurrency).toBe(4);
    });

    it('verifies a runner token and refuses the stale one after regeneration', async () => {
        const created = await createBuildRunner(
            { name: 'runner-beta', description: '', labels: '', maxConcurrency: 2 },
            world.users.admin.id,
        );

        expect(await verifyBuildRunnerToken(created.token)).toMatchObject({ name: 'runner-beta' });

        const regenerated = await regenerateBuildRunnerToken(created.runner.id);

        expect(regenerated.token).not.toBe(created.token);
        expect(await verifyBuildRunnerToken(created.token)).toBeNull();
        expect(await verifyBuildRunnerToken(regenerated.token)).toMatchObject({ name: 'runner-beta' });
    });

    it('refuses the token of a disabled runner', async () => {
        const created = await createBuildRunner(
            { name: 'runner-gamma', description: '', labels: '', maxConcurrency: 2 },
            world.users.admin.id,
        );

        await updateBuildRunner({
            id: created.runner.id,
            name: 'runner-gamma',
            description: '',
            labels: '',
            maxConcurrency: 2,
            enabled: false,
        });

        expect(await verifyBuildRunnerToken(created.token)).toBeNull();
    });

    it('refuses a token that was never issued', async () => {
        expect(await verifyBuildRunnerToken(`nxr_${'0'.repeat(64)}`)).toBeNull();
        expect(await verifyBuildRunnerToken('not-a-runner-token')).toBeNull();
    });
});
