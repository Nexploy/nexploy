import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { deleteRepositoryAction } from '@/actions/repository/settings/deleteRepository.action';
import { onStartBuild } from '@/actions/repository/builds/startBuild.action';
import { onEnvVariableAction } from '@/actions/repository/updateEnvVariables.action';
import { upsertStageAction } from '@/actions/repository/stages/upsertStage.action';
import { onRepositoryCreateAction } from '@/actions/repository/repositoryCreate.action';
import { savePipelineAction } from '@/actions/repository/pipeline/savePipeline.action';
import { resetDatabase } from '../setup/db';
import { prisma } from '../../prisma/prisma';
import { seedWorld, type WorldFixture } from '../setup/fixtures';
import { loginAs } from '../setup/session';
import { allowOnly, describePermissionMatrix } from './permissionMatrix';
import { FORBIDDEN_MESSAGE, type ActionResult } from '../setup/invoke';

const ORG_A_WRITERS = ['admin', 'orgOwner', 'orgAdmin'] as const;

describePermissionMatrix('repository server actions', [
    {
        name: 'deleteRepositoryAction',
        kind: 'action',
        invoke: (world) => deleteRepositoryAction({ repositoryId: world.repositories.inOrgA, confirmName: 'repo-a' }),
        expected: allowOnly(...ORG_A_WRITERS),
    },
    {
        name: 'deleteRepositoryAction on another organization repository',
        kind: 'action',
        invoke: (world) => deleteRepositoryAction({ repositoryId: world.repositories.inOrgB, confirmName: 'repo-b' }),
        expected: allowOnly('admin', 'outsider'),
    },
    {
        name: 'onStartBuild',
        kind: 'action',
        invoke: (world) => onStartBuild({ repositoryId: world.repositories.inOrgA }),
        expected: allowOnly(...ORG_A_WRITERS, 'orgMember'),
    },
    {
        name: 'onEnvVariableAction',
        kind: 'action',
        invoke: (world) =>
            onEnvVariableAction({
                repositoryId: world.repositories.inOrgA,
                envVariables: [{ key: 'API_URL', value: 'https://example.test' }],
                deleteIds: [],
            }),
        expected: allowOnly(...ORG_A_WRITERS),
    },
    {
        name: 'upsertStageAction',
        kind: 'action',
        invoke: (world) =>
            upsertStageAction({
                repositoryId: world.repositories.inOrgA,
                name: 'staging',
                branch: 'main',
            } as never),
        expected: allowOnly(...ORG_A_WRITERS),
    },
    {
        name: 'savePipelineAction',
        kind: 'action',
        invoke: (world) =>
            savePipelineAction({
                repositoryId: world.repositories.inOrgA,
                nodes: [],
                edges: [],
            } as never),
        expected: allowOnly(...ORG_A_WRITERS),
    },
    {
        name: 'onRepositoryCreateAction',
        kind: 'action',
        invoke: () =>
            onRepositoryCreateAction({
                name: 'new-repository',
                repositoryUrl: 'https://github.com/nexploy/new-repository',
                gitProvider: 'GITHUB',
                gitId: 'new-repository',
            } as never),
        expected: allowOnly('admin', 'orgOwner', 'orgAdmin', 'outsider'),
    },
]);

describe('repository server action effects', () => {
    let world: WorldFixture;

    beforeAll(async () => {
        await resetDatabase();
        world = await seedWorld();
    });

    afterAll(async () => {
        await resetDatabase();
    });

    it('writes the environment variables an organization admin submits', async () => {
        await loginAs(world.users.orgAdmin);

        await onEnvVariableAction({
            repositoryId: world.repositories.inOrgA,
            envVariables: [{ key: 'API_URL', value: 'https://example.test' }],
            deleteIds: [],
        });

        const stored = await prisma.envVariable.findMany({
            where: { repositoryId: world.repositories.inOrgA },
            select: { key: true, value: true },
        });

        expect(stored).toHaveLength(1);
        expect(stored[0]?.key).toBe('API_URL');
        expect(stored[0]?.value, 'environment variable values must be encrypted at rest').not.toBe(
            'https://example.test',
        );
    });

    it('leaves the database untouched when an organization member is denied', async () => {
        await loginAs(world.users.orgMember);

        const before = await prisma.envVariable.count({ where: { repositoryId: world.repositories.inOrgA } });

        const result = (await onEnvVariableAction({
            repositoryId: world.repositories.inOrgA,
            envVariables: [{ key: 'INJECTED', value: 'nope' }],
            deleteIds: [],
        })) as ActionResult;

        const after = await prisma.envVariable.count({ where: { repositoryId: world.repositories.inOrgA } });

        expect(result.serverError).toBe(FORBIDDEN_MESSAGE);
        expect(after).toBe(before);
    });

    it('records a denied activity log entry when a guard rejects the caller', async () => {
        await loginAs(world.users.orgMember);

        await deleteRepositoryAction({ repositoryId: world.repositories.inOrgA, confirmName: 'repo-a' });

        const entry = await prisma.activityLog.findFirst({
            where: { name: 'repository.delete', actorId: world.users.orgMember.id },
            orderBy: { createdAt: 'desc' },
        });

        expect(entry?.status).toBe('DENIED');
    });

    it('keeps the repository when the caller is denied', async () => {
        await loginAs(world.users.outsider);

        await deleteRepositoryAction({ repositoryId: world.repositories.inOrgA, confirmName: 'repo-a' });

        const repository = await prisma.repository.findUnique({ where: { id: world.repositories.inOrgA } });

        expect(repository).not.toBeNull();
    });
});
