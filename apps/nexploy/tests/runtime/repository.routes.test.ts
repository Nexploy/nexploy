import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { GET as listRepositories } from '@/app/api/repositories/route';
import { GET as getRepository } from '@/app/api/repositories/[repositoryId]/route';
import { GET as listStages } from '@/app/api/repositories/[repositoryId]/stages/route';
import { GET as listBuilds } from '@/app/api/repositories/[repositoryId]/builds/route';
import { callRoute, readJson, type RouteHandler } from '../setup/invoke';
import { resetDatabase } from '../setup/db';
import { seedWorld, type WorldFixture } from '../setup/fixtures';
import { loginAs, logout } from '../setup/session';
import { allowOnly, describePermissionMatrix } from './permissionMatrix';

const repositoryRoute = (handler: unknown, repositoryId: string) =>
    callRoute(handler as RouteHandler, {
        url: `http://localhost:3022/api/repositories/${repositoryId}`,
        params: { repositoryId },
    });

describePermissionMatrix('repository API routes', [
    {
        name: 'GET /api/repositories',
        kind: 'route',
        invoke: () => callRoute(listRepositories as RouteHandler, { url: 'http://localhost:3022/api/repositories' }),
        expected: allowOnly('guest', 'developer', 'admin', 'system', 'orgOwner', 'orgAdmin', 'orgMember', 'outsider'),
    },
    {
        name: 'GET /api/repositories/[repositoryId] on an organization A repository',
        kind: 'route',
        invoke: (world) => repositoryRoute(getRepository, world.repositories.inOrgA),
        expected: allowOnly('admin', 'orgOwner', 'orgAdmin', 'orgMember'),
    },
    {
        name: 'GET /api/repositories/[repositoryId] on an organization B repository',
        kind: 'route',
        invoke: (world) => repositoryRoute(getRepository, world.repositories.inOrgB),
        expected: allowOnly('admin', 'outsider'),
    },
    {
        name: 'GET /api/repositories/[repositoryId]/stages',
        kind: 'route',
        invoke: (world) =>
            callRoute(listStages as RouteHandler, {
                url: `http://localhost:3022/api/repositories/${world.repositories.inOrgA}/stages`,
                params: { repositoryId: world.repositories.inOrgA },
            }),
        expected: allowOnly('admin', 'orgOwner', 'orgAdmin', 'orgMember'),
    },
    {
        name: 'GET /api/repositories/[repositoryId]/builds',
        kind: 'route',
        invoke: (world) =>
            callRoute(listBuilds as RouteHandler, {
                url: `http://localhost:3022/api/repositories/${world.repositories.inOrgA}/builds`,
                params: { repositoryId: world.repositories.inOrgA },
            }),
        expected: allowOnly('admin', 'orgOwner', 'orgAdmin', 'orgMember'),
    },
]);

describe('repository API route payloads', () => {
    let world: WorldFixture;

    beforeAll(async () => {
        await resetDatabase();
        world = await seedWorld();
    });

    afterAll(async () => {
        await resetDatabase();
    });

    it('returns only the repositories of the caller active organization', async () => {
        await loginAs(world.users.orgOwner);

        const response = await callRoute(listRepositories as RouteHandler, {
            url: 'http://localhost:3022/api/repositories',
        });
        const body = await readJson<{ id: string }[]>(response);

        expect(response.status).toBe(200);
        expect(body.map((repository) => repository.id)).toEqual([world.repositories.inOrgA]);
    });

    it('returns the repositories of every organization to a global admin', async () => {
        await loginAs(world.users.admin);

        const response = await callRoute(listRepositories as RouteHandler, {
            url: 'http://localhost:3022/api/repositories',
        });
        const body = await readJson<{ id: string }[]>(response);

        expect(response.status).toBe(200);
        expect(body.map((repository) => repository.id).sort()).toEqual(
            [world.repositories.inOrgA, world.repositories.inOrgB].sort(),
        );
    });

    it('never leaks another organization repositories to an outsider', async () => {
        await loginAs(world.users.outsider);

        const response = await callRoute(listRepositories as RouteHandler, {
            url: 'http://localhost:3022/api/repositories',
        });
        const body = await readJson<{ id: string }[]>(response);

        expect(body.map((repository) => repository.id)).not.toContain(world.repositories.inOrgA);
    });

    it('returns the repository shape the client expects', async () => {
        await loginAs(world.users.orgOwner);

        const response = await repositoryRoute(getRepository, world.repositories.inOrgA);
        const body = await readJson<Record<string, unknown>>(response);

        expect(response.status).toBe(200);
        expect(body).toMatchObject({
            id: world.repositories.inOrgA,
            name: 'repo-a',
            gitProvider: 'GITHUB',
            organizationId: world.orgA.id,
        });
    });

    it('answers 404 for a repository that does not exist', async () => {
        await loginAs(world.users.admin);

        const response = await repositoryRoute(getRepository, 'missing-repository');

        expect(response.status).toBe(404);
    });

    it('denies an anonymous caller', async () => {
        logout();

        const response = await callRoute(listRepositories as RouteHandler, {
            url: 'http://localhost:3022/api/repositories',
        });

        expect(response.status).toBe(403);
    });
});
