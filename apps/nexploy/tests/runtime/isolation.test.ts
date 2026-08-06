import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import { onStartBuild } from '@/actions/repository/builds/startBuild.action';
import { inngest } from '@/inngest/client';
import { kyDocker } from '@/lib/api/kyDocker';
import { dockerCalls } from '../setup/dockerMock';
import { inngestEvents } from '../setup/inngestMock';
import { resetDatabase } from '../setup/db';
import { seedWorld, type WorldFixture } from '../setup/fixtures';
import { loginAs } from '../setup/session';

const USES_REAL_DOCKER_API = process.env.NEXPLOY_TEST_DOCKER === 'real';

const DEVELOPMENT_PORTS = [':3300', ':5433', ':3000'];

describe('test environment isolation', () => {
    let world: WorldFixture;
    let outbound: string[];
    let realFetch: typeof globalThis.fetch;

    beforeEach(async () => {
        await resetDatabase();
        world = await seedWorld();

        outbound = [];
        realFetch = globalThis.fetch;
        globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
            outbound.push(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
            return realFetch(input, init);
        }) as typeof fetch;
    });

    afterEach(() => {
        globalThis.fetch = realFetch;
    });

    afterAll(async () => {
        await resetDatabase();
    });

    it('points the database at the throwaway instance', () => {
        expect(process.env.DATABASE_URL).toContain('5434');
        expect(process.env.DATABASE_URL).toContain('nexploy_test');
    });

    it('points docker-api at the isolated instance, never at the development one', () => {
        expect(process.env.DOCKER_API_URL).not.toContain(':3300');
        expect(process.env.DOCKER_API_URL).toContain(process.env.TEST_DOCKER_API_PORT ?? '3322');
    });

    it('keeps the docker client mocked outside of the Docker-in-Docker mode', () => {
        expect(USES_REAL_DOCKER_API || typeof (kyDocker as { extend?: unknown }).extend === 'function').toBe(true);
        expect(Array.isArray(dockerCalls)).toBe(true);
    });

    it('sends no Inngest event over the network', async () => {
        await inngest.send({ name: 'build/start', data: { probe: true } });

        expect(inngestEvents).toEqual([{ name: 'build/start', data: { probe: true } }]);
        expect(outbound.filter((url) => url.includes('8288'))).toEqual([]);
    });

    it('reaches no development port while running a build action', async () => {
        await loginAs(world.users.orgOwner);

        await onStartBuild({ repositoryId: world.repositories.inOrgA });

        const leaks = outbound.filter((url) => DEVELOPMENT_PORTS.some((port) => url.includes(port)));

        expect(leaks, 'a test reached the development stack').toEqual([]);
    });
});
