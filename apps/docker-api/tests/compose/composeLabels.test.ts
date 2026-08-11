import { describe, expect, it } from 'vitest';
import { applyComposeLabels, mergeComposeLabels } from '@/utils/compose/composePhases';
import type { ComposeService } from '@workspace/typescript-interface/docker/docker.compose.build';

describe('mergeComposeLabels', () => {
    it('merges into map form', () => {
        expect(mergeComposeLabels({ team: 'core' }, { 'nexploy.build': '1' })).toEqual({
            team: 'core',
            'nexploy.build': '1',
        });
    });

    it('keeps list form and preserves user entries', () => {
        expect(mergeComposeLabels(['team=core', 'tier=web'], { 'nexploy.build': '1' })).toEqual([
            'team=core',
            'tier=web',
            'nexploy.build=1',
        ]);
    });

    it('replaces a colliding key instead of duplicating it in list form', () => {
        expect(mergeComposeLabels(['nexploy.build=old', 'team=core'], { 'nexploy.build': 'new' })).toEqual([
            'team=core',
            'nexploy.build=new',
        ]);
    });

    it('handles missing labels', () => {
        expect(mergeComposeLabels(undefined, { a: 'b' })).toEqual({ a: 'b' });
    });
});

describe('applyComposeLabels', () => {
    it('never sets container_name', () => {
        const service: ComposeService = { image: 'nginx' };
        applyComposeLabels(service, { 'nexploy.build': '1' });
        expect(service.container_name).toBeUndefined();
    });

    it('promotes shorthand build string to an object carrying the labels', () => {
        const service: ComposeService = { build: './api' };
        applyComposeLabels(service, { 'nexploy.build': '1' });
        expect(service.build).toEqual({ context: './api', labels: { 'nexploy.build': '1' } });
    });

    it('preserves list-form build labels', () => {
        const service: ComposeService = { build: { context: '.', labels: ['team=core'] } };
        applyComposeLabels(service, { 'nexploy.build': '1' });
        expect(typeof service.build === 'object' && service.build.labels).toEqual(['team=core', 'nexploy.build=1']);
    });
});
