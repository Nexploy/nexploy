import { describe, expect, it } from 'vitest';
import type { ActivityLogEntry } from '@workspace/typescript-interface/activity';
import { anonymizeActivityEntry, maskIpAddress, pseudonymize, scrubText } from '@/lib/activity/anonymizeActivity';

const entry: ActivityLogEntry = {
    id: 'log_1',
    createdAt: '2026-01-01T10:00:00.000Z',
    name: 'user.updateRole',
    source: 'SERVER_ACTION',
    status: 'SUCCESS',
    resource: 'user',
    action: 'updateRole',
    actorType: 'USER',
    actorId: 'usr_42',
    actorEmail: 'nathan.abitbol@example.com',
    actorRole: 'admin',
    actorName: 'Nathan Abitbol',
    organizationId: 'org_1',
    targetType: 'user',
    targetId: 'usr_7',
    targetName: 'jane.doe@example.com',
    environmentId: null,
    durationMs: 12,
    errorMessage: 'refused for jane.doe@example.com from 192.168.1.42',
    ipAddress: '192.168.1.42',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0 Safari/537.36',
    metadata: { email: 'jane.doe@example.com', token: 'eyJhbGciOi.J9payload.signature', count: 3 },
};

describe('activity anonymization', () => {
    it('pseudonymizes the author and truncates the technical identifiers', () => {
        const result = anonymizeActivityEntry(entry);

        expect(result.actorId).toMatch(/^anon_[a-f\d]{16}$/);
        expect(result.actorEmail).toBe('n***@example.com');
        expect(result.actorName).toBe('N. A.');
        expect(result.ipAddress).toBe('192.168.1.0/24');
        expect(result.userAgent).toBe('Chrome — macOS');
    });

    it('keeps the non personal fields untouched', () => {
        const result = anonymizeActivityEntry(entry);

        expect(result.id).toBe(entry.id);
        expect(result.name).toBe(entry.name);
        expect(result.status).toBe(entry.status);
        expect(result.actorRole).toBe(entry.actorRole);
        expect(result.durationMs).toBe(entry.durationMs);
    });

    it('scrubs personal data out of free-text fields and metadata', () => {
        const result = anonymizeActivityEntry(entry);

        expect(result.targetName).toBe('[email]');
        expect(result.errorMessage).toBe('refused for [email] from [ip]');
        expect(result.metadata).toEqual({ email: '[email]', token: '[secret]', count: 3 });
    });

    it('resolves the same pseudonym for the same actor', () => {
        expect(pseudonymize('usr_42')).toBe(pseudonymize('usr_42'));
        expect(pseudonymize('usr_42')).not.toBe(pseudonymize('usr_43'));
        expect(pseudonymize(null)).toBeNull();
    });

    it('truncates ipv6 addresses to their /48 prefix', () => {
        expect(maskIpAddress('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe('2001:0db8:85a3::/48');
        expect(maskIpAddress(null)).toBeNull();
    });

    it('leaves timestamps alone while scrubbing addresses', () => {
        expect(scrubText('failed at 10:30:45 from 10.0.0.8')).toBe('failed at 10:30:45 from [ip]');
    });
});
