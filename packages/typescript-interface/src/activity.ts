import type { PaginatedResult } from './table';

export type ActivitySource = 'SERVER_ACTION' | 'API_ROUTE' | 'SYSTEM';

export type ActivityStatus = 'SUCCESS' | 'FAILURE' | 'DENIED';

export type ActivityActorType = 'USER' | 'API_KEY' | 'SYSTEM';

export interface ActivityLogEntry {
    id: string;
    createdAt: string;
    name: string;
    source: ActivitySource;
    status: ActivityStatus;
    resource: string | null;
    action: string | null;
    actorType: ActivityActorType;
    actorId: string | null;
    actorEmail: string | null;
    actorRole: string | null;
    actorName: string | null;
    organizationId: string | null;
    targetType: string | null;
    targetId: string | null;
    targetName: string | null;
    environmentId: string | null;
    durationMs: number | null;
    errorMessage: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    metadata: unknown;
}

export type ActivityLogPage = PaginatedResult<ActivityLogEntry>;

export type ActivityExportFormat = 'csv' | 'json' | 'ndjson';

export interface ActivityPurgeResult {
    purged: number;
    purgedBefore: string | null;
}

export interface ActivitySettings {
    retentionDays: number;
    lastPurgeAt: string | null;
    lastPurgeCount: number;
}

export type ActivityStreamEvent =
    | { type: 'ready'; timestamp: number }
    | { type: 'activity-created'; entry: ActivityLogEntry; timestamp: number }
    | { type: 'activity-purged'; purged: number; purgedBefore: string | null; timestamp: number }
    | { type: 'heartbeat'; timestamp: number }
    | { type: 'error'; error: string; timestamp: number };

export type ActivityConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';
