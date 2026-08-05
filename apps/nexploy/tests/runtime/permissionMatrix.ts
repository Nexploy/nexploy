import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { resetDatabase } from '../setup/db';
import { FIXTURE_USERS, type FixtureUserKey, seedWorld, type WorldFixture } from '../setup/fixtures';
import { loginAs, logout } from '../setup/session';
import { isTestRedirectError } from '../setup/nextMocks';
import {
    expectActionAllowed,
    expectActionForbidden,
    expectRouteAllowed,
    expectRouteForbidden,
    type ActionResult,
} from '../setup/invoke';

export type Verdict = 'allow' | 'deny';

export { FIXTURE_USERS, type FixtureUserKey };

export type Expectations = Record<FixtureUserKey, Verdict>;

export interface EndpointCase {
    name: string;
    kind: 'action' | 'route';
    invoke: (world: WorldFixture) => Promise<unknown>;
    expected: Expectations;
    setup?: (world: WorldFixture) => Promise<void> | void;
}

export function allowOnly(...allowed: FixtureUserKey[]): Expectations {
    return Object.fromEntries(
        FIXTURE_USERS.map((user) => [user, allowed.includes(user) ? 'allow' : 'deny']),
    ) as Expectations;
}

export function denyOnly(...denied: FixtureUserKey[]): Expectations {
    return Object.fromEntries(
        FIXTURE_USERS.map((user) => [user, denied.includes(user) ? 'deny' : 'allow']),
    ) as Expectations;
}

async function invokeCase(testCase: EndpointCase, world: WorldFixture): Promise<unknown> {
    try {
        return await testCase.invoke(world);
    } catch (error) {
        if (isTestRedirectError(error)) return { data: undefined };
        throw error;
    }
}

async function assertVerdict(testCase: EndpointCase, verdict: Verdict, outcome: unknown) {
    if (testCase.kind === 'route') {
        const response = outcome as Response;
        if (verdict === 'deny') expectRouteForbidden(response);
        else expectRouteAllowed(response);
        return;
    }

    const result = outcome as ActionResult;
    if (verdict === 'deny') expectActionForbidden(result);
    else expectActionAllowed(result);
}

export function describePermissionMatrix(suiteName: string, cases: EndpointCase[]) {
    describe(suiteName, () => {
        let world: WorldFixture;

        beforeEach(async () => {
            await resetDatabase();
            world = await seedWorld();
        });

        afterAll(async () => {
            await resetDatabase();
        });

        for (const testCase of cases) {
            describe(testCase.name, () => {
                it('denies an anonymous caller', async () => {
                    logout();
                    await testCase.setup?.(world);

                    if (testCase.kind === 'route') {
                        const response = (await testCase.invoke(world)) as Response;
                        expect(response.status).toBe(403);
                        return;
                    }

                    await expect(testCase.invoke(world)).rejects.toThrow();
                });

                for (const userKey of FIXTURE_USERS) {
                    const verdict = testCase.expected[userKey];

                    it(`${verdict}s ${userKey}`, async () => {
                        await loginAs(world.users[userKey]);
                        await testCase.setup?.(world);

                        const outcome = await invokeCase(testCase, world);
                        await assertVerdict(testCase, verdict, outcome);
                    });
                }
            });
        }
    });
}
