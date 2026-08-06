import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { inngest } from '@/inngest/client';
import { onStartBuild } from '@/actions/repository/builds/startBuild.action';
import { FORBIDDEN_MESSAGE, type ActionResult } from '../setup/invoke';
import { resetDatabase } from '../setup/db';
import { prisma } from '../../prisma/prisma';
import { seedWorld, type WorldFixture } from '../setup/fixtures';
import { loginAs } from '../setup/session';

const REAL_INNGEST = process.env.NEXPLOY_TEST_INNGEST === 'real' || process.env.NEXPLOY_TEST_DOCKER === 'real';

const INNGEST_URL = process.env.INNGEST_BASE_URL ?? 'http://127.0.0.1:8299';

interface InngestEventRow {
    id: string;
    name: string;
}

async function fetchEvents(): Promise<InngestEventRow[]> {
    const response = await fetch(`${INNGEST_URL}/v1/events?limit=50`, {
        headers: { Authorization: `Bearer ${process.env.INNGEST_SIGNING_KEY ?? ''}` },
    });

    if (!response.ok) return [];

    const body = (await response.json()) as { data?: InngestEventRow[] };

    return body.data ?? [];
}

async function waitForEvent(name: string): Promise<InngestEventRow | undefined> {
    const deadline = Date.now() + 15_000;

    while (Date.now() < deadline) {
        const found = (await fetchEvents()).find((event) => event.name === name);
        if (found) return found;

        await new Promise((resolve) => setTimeout(resolve, 250));
    }

    return undefined;
}

describe.runIf(REAL_INNGEST)('Inngest against the throwaway server', () => {
    let world: WorldFixture;

    beforeEach(async () => {
        await resetDatabase();
        world = await seedWorld();
    });

    afterAll(async () => {
        await resetDatabase();
    });

    it('targets the isolated Inngest server, not the development one', () => {
        expect(process.env.INNGEST_BASE_URL).not.toContain(':8288');
        expect(process.env.INNGEST_BASE_URL).toContain(process.env.TEST_INNGEST_PORT ?? '8299');
    });

    it('accepts an event sent through the real client', async () => {
        const result = await inngest.send({
            name: 'tests/probe',
            data: { at: Date.now() },
        });

        expect(result.ids.length).toBeGreaterThan(0);
        expect(await waitForEvent('tests/probe')).toBeDefined();
    });

    it('emits a build event when an allowed caller starts a build', async () => {
        await prisma.repository.update({
            where: { id: world.repositories.inOrgA },
            data: { gitAccountId: null },
        });

        await loginAs(world.users.orgOwner);
        await onStartBuild({ repositoryId: world.repositories.inOrgA });

        const build = await prisma.build.findFirst({
            where: { repositoryId: world.repositories.inOrgA },
            orderBy: { createdAt: 'desc' },
        });

        expect(build).not.toBeNull();
    });

    it('emits nothing when the caller is denied', async () => {
        const before = (await fetchEvents()).length;

        await loginAs(world.users.outsider);
        const result = (await onStartBuild({ repositoryId: world.repositories.inOrgA })) as ActionResult;

        await new Promise((resolve) => setTimeout(resolve, 1_000));
        const after = (await fetchEvents()).length;

        expect(result.serverError).toBe(FORBIDDEN_MESSAGE);
        expect(after).toBe(before);
    });
});
