import type {
    ActivityLogEntry,
    ActivityLogPage,
    ActivityPurgeResult,
    ActivitySettings,
} from '@workspace/typescript-interface/activity';
import type { PageSize, SortDirection } from '@workspace/typescript-interface/table';
import type { Prisma } from '../../generated/client';
import { prisma } from '../../prisma/prisma';
import { publishActivityPurged } from '@/lib/activity/activityBus';
import { resolveOrderBy, resolvePagination, toPaginatedResult } from '@/lib/pagination';

const DEFAULT_PAGE_SIZE = 50;
const EXPORT_BATCH_SIZE = 500;

const ACTIVITY_ORDER_BY: Record<string, (direction: SortDirection) => Prisma.ActivityLogOrderByWithRelationInput> = {
    createdAt: (direction) => ({ createdAt: direction }),
    name: (direction) => ({ name: direction }),
    actor: (direction) => ({ actorEmail: direction }),
    actorRole: (direction) => ({ actorRole: direction }),
    source: (direction) => ({ source: direction }),
    status: (direction) => ({ status: direction }),
    durationMs: (direction) => ({ durationMs: direction }),
};

export const ACTIVITY_ACTOR_INCLUDE = { actor: { select: { name: true } } } as const;

export interface ActivityLogQuery {
    page?: number;
    pageSize?: PageSize;
    search?: string;
    sortBy?: string;
    sortOrder?: SortDirection;
    name?: string;
    resource?: string;
    status?: ActivityLogEntry['status'];
    source?: ActivityLogEntry['source'];
    actorId?: string;
    from?: Date;
    to?: Date;
}

type ActivityLogRow = Prisma.ActivityLogGetPayload<{ include: typeof ACTIVITY_ACTOR_INCLUDE }>;

export function toActivityLogEntry(row: ActivityLogRow): ActivityLogEntry {
    return {
        id: row.id,
        createdAt: row.createdAt.toISOString(),
        name: row.name,
        source: row.source,
        status: row.status,
        resource: row.resource,
        action: row.action,
        actorType: row.actorType,
        actorId: row.actorId,
        actorEmail: row.actorEmail,
        actorRole: row.actorRole,
        actorName: row.actor?.name ?? null,
        organizationId: row.organizationId,
        targetType: row.targetType,
        targetId: row.targetId,
        targetName: row.targetName,
        environmentId: row.environmentId,
        durationMs: row.durationMs,
        errorMessage: row.errorMessage,
        ipAddress: row.ipAddress,
        userAgent: row.userAgent,
        metadata: row.metadata,
    };
}

function buildWhere({
    search,
    name,
    resource,
    status,
    source,
    actorId,
    from,
    to,
}: ActivityLogQuery): Prisma.ActivityLogWhereInput {
    const where: Prisma.ActivityLogWhereInput = {};

    if (name) where.name = name;
    if (resource) where.resource = resource;
    if (status) where.status = status;
    if (source) where.source = source;
    if (actorId) where.actorId = actorId;

    if (from || to) {
        where.createdAt = {};
        if (from) where.createdAt.gte = from;
        if (to) where.createdAt.lte = to;
    }

    if (search) {
        where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { targetName: { contains: search, mode: 'insensitive' } },
            { targetId: { contains: search, mode: 'insensitive' } },
            { actorEmail: { contains: search, mode: 'insensitive' } },
            { errorMessage: { contains: search, mode: 'insensitive' } },
        ];
    }

    return where;
}

export async function queryActivityLogs(query: ActivityLogQuery): Promise<ActivityLogPage> {
    const where = buildWhere(query);

    const total = await prisma.activityLog.count({ where });
    const { page, pageSize, skip, take } = resolvePagination(query, total, DEFAULT_PAGE_SIZE);

    const rows = await prisma.activityLog.findMany({
        where,
        include: ACTIVITY_ACTOR_INCLUDE,
        orderBy: [resolveOrderBy(query, ACTIVITY_ORDER_BY, 'createdAt'), { id: 'desc' }],
        skip,
        take,
    });

    return toPaginatedResult(rows.map(toActivityLogEntry), { total, page, pageSize });
}

export async function countActivityLogs(query: ActivityLogQuery): Promise<number> {
    return prisma.activityLog.count({ where: buildWhere(query) });
}

export async function* iterateActivityLogs(
    query: ActivityLogQuery,
    limit = Number.POSITIVE_INFINITY,
): AsyncGenerator<ActivityLogEntry> {
    const where = buildWhere(query);

    let cursor: string | undefined;
    let remaining = limit;

    while (remaining > 0) {
        const take = Math.min(EXPORT_BATCH_SIZE, remaining);

        const rows = await prisma.activityLog.findMany({
            where,
            include: ACTIVITY_ACTOR_INCLUDE,
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            take,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        });

        if (rows.length === 0) return;

        for (const row of rows) yield toActivityLogEntry(row);

        remaining -= rows.length;
        cursor = rows[rows.length - 1]?.id;

        if (rows.length < take) return;
    }
}

export async function getActivitySettings(): Promise<ActivitySettings> {
    const settings = await prisma.activitySettings.upsert({
        where: { singleton: 'default' },
        create: {},
        update: {},
    });

    return {
        retentionDays: settings.retentionDays,
        lastPurgeAt: settings.lastPurgeAt?.toISOString() ?? null,
        lastPurgeCount: settings.lastPurgeCount,
    };
}

export async function updateActivityRetention(retentionDays: number): Promise<ActivitySettings> {
    const settings = await prisma.activitySettings.upsert({
        where: { singleton: 'default' },
        create: { retentionDays },
        update: { retentionDays },
    });

    return {
        retentionDays: settings.retentionDays,
        lastPurgeAt: settings.lastPurgeAt?.toISOString() ?? null,
        lastPurgeCount: settings.lastPurgeCount,
    };
}

export async function purgeExpiredActivityLogs(): Promise<ActivityPurgeResult> {
    const { retentionDays } = await getActivitySettings();

    if (retentionDays <= 0) return { purged: 0, purgedBefore: null };

    const threshold = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    const { count } = await prisma.activityLog.deleteMany({ where: { createdAt: { lt: threshold } } });

    await prisma.activitySettings.update({
        where: { singleton: 'default' },
        data: { lastPurgeAt: new Date(), lastPurgeCount: count },
    });

    const result: ActivityPurgeResult = { purged: count, purgedBefore: threshold.toISOString() };
    publishActivityPurged(result);

    return result;
}
