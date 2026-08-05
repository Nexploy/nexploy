import type {
    ActivityLogEntry,
    ActivityLogPage,
    ActivityPurgeResult,
    ActivitySettings,
} from '@workspace/typescript-interface/activity';
import type { Prisma } from '../../generated/client';
import { prisma } from '../../prisma/prisma';
import { publishActivityPurged } from '@/lib/activity/activityBus';

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 500;

export const ACTIVITY_ACTOR_INCLUDE = { actor: { select: { name: true } } } as const;

export interface ActivityLogQuery {
    page?: number;
    pageSize?: number;
    search?: string;
    name?: string;
    resource?: string;
    status?: ActivityLogEntry['status'];
    source?: ActivityLogEntry['source'];
    actorId?: string;
    from?: Date;
    to?: Date;
    before?: Date;
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
    before,
}: ActivityLogQuery): Prisma.ActivityLogWhereInput {
    const where: Prisma.ActivityLogWhereInput = {};

    if (name) where.name = name;
    if (resource) where.resource = resource;
    if (status) where.status = status;
    if (source) where.source = source;
    if (actorId) where.actorId = actorId;

    if (from || to || before) {
        where.createdAt = {};
        if (from) where.createdAt.gte = from;
        if (to) where.createdAt.lte = to;
        if (before) where.createdAt.lt = before;
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
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, query.pageSize ?? DEFAULT_PAGE_SIZE));
    const where = buildWhere(query);

    const [rows, total] = await Promise.all([
        prisma.activityLog.findMany({
            where,
            include: ACTIVITY_ACTOR_INCLUDE,
            orderBy: { createdAt: 'desc' },
            skip: query.before ? 0 : (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma.activityLog.count({ where }),
    ]);

    return {
        entries: rows.map(toActivityLogEntry),
        total,
        page,
        pageSize,
        pageCount: Math.max(1, Math.ceil(total / pageSize)),
    };
}

export async function getRecentActivityLogs(limit: number): Promise<{ entries: ActivityLogEntry[]; hasMore: boolean }> {
    const take = Math.min(MAX_PAGE_SIZE, Math.max(1, limit));

    const rows = await prisma.activityLog.findMany({
        include: ACTIVITY_ACTOR_INCLUDE,
        orderBy: { createdAt: 'desc' },
        take: take + 1,
    });

    return {
        entries: rows.slice(0, take).map(toActivityLogEntry),
        hasMore: rows.length > take,
    };
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
