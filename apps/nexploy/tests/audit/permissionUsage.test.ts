import { describe, expect, it } from 'vitest';
import { collectEndpoints } from './inventory';
import { PERMISSION_STATEMENT } from '@/lib/auth/permissions';

const DELEGATED_RESOURCES = new Set(['user', 'session']);

const endpoints = collectEndpoints();

const required = new Set(
    endpoints.flatMap((endpoint) => endpoint.guards.map((guard) => `${guard.resource}.${guard.action}`)),
);

describe('permission usage', () => {
    it('records which declared permissions no endpoint requires', () => {
        const unused = Object.entries(PERMISSION_STATEMENT)
            .filter(([resource]) => !DELEGATED_RESOURCES.has(resource))
            .flatMap(([resource, actions]) =>
                (actions as readonly string[])
                    .map((action) => `${resource}.${action}`)
                    .filter((key) => !required.has(key)),
            )
            .sort();

        expect(unused).toMatchSnapshot();
    });

    it('requires no permission that the access control does not declare', () => {
        const declared = new Set(
            Object.entries(PERMISSION_STATEMENT).flatMap(([resource, actions]) =>
                (actions as readonly string[]).map((action) => `${resource}.${action}`),
            ),
        );

        expect([...required].filter((key) => !declared.has(key))).toEqual([]);
    });
});
