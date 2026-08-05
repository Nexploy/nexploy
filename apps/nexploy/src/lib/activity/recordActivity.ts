import { headers } from 'next/headers';
import type { ActivityActorType, ActivitySource, ActivityStatus } from '@workspace/typescript-interface/activity';
import { prisma } from '../../../prisma/prisma';
import { getCurrentActor } from '@/lib/api/currentActor';
import { redactMetadata } from '@/lib/activity/redact';
import { publishActivityCreated } from '@/lib/activity/activityBus';
import { ACTIVITY_ACTOR_INCLUDE, toActivityLogEntry } from '@/services/activityLog.service';

const TARGET_ID_KEYS = [
    'containerId',
    'repositoryId',
    'imageId',
    'networkId',
    'volumeName',
    'environmentId',
    'registryId',
    'userId',
    'organizationId',
    'stageId',
    'buildId',
    'certificateId',
    'domainId',
    'scheduleId',
    'id',
];

const TARGET_NAME_KEYS = ['name', 'imageName', 'volumeName', 'repositoryName', 'email', 'domain', 'targetName', 'path'];

const TARGET_LIST_KEYS = ['containerIds', 'imageIds', 'networkIds', 'volumeNames', 'serviceIds'];

export interface RecordActivityInput {
    name: string;
    source: ActivitySource;
    status: ActivityStatus;
    input?: unknown;
    durationMs?: number;
    errorMessage?: string;
    environmentId?: string;
}

function firstString(input: Record<string, unknown>, keys: string[]): string | undefined {
    for (const key of keys) {
        const value = input[key];
        if (typeof value === 'string' && value.length > 0) return value;
    }

    return undefined;
}

function extractTarget(input: unknown): { targetId?: string; targetName?: string } {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return {};

    const record = input as Record<string, unknown>;

    for (const key of TARGET_LIST_KEYS) {
        const value = record[key];
        if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') {
            return {
                targetId: value[0],
                targetName: value.length > 1 ? `${value[0]} +${value.length - 1}` : value[0],
            };
        }
    }

    return {
        targetId: firstString(record, TARGET_ID_KEYS),
        targetName: firstString(record, TARGET_NAME_KEYS),
    };
}

function splitName(name: string): { resource?: string; action?: string } {
    const separator = name.lastIndexOf('.');
    if (separator <= 0) return {};

    return { resource: name.slice(0, separator), action: name.slice(separator + 1) };
}

async function readRequestContext(): Promise<{ ipAddress?: string; userAgent?: string }> {
    try {
        const headerStore = await headers();
        const forwardedFor = headerStore.get('x-forwarded-for');

        return {
            ipAddress: forwardedFor?.split(',')[0]?.trim() ?? headerStore.get('x-real-ip') ?? undefined,
            userAgent: headerStore.get('user-agent') ?? undefined,
        };
    } catch {
        return {};
    }
}

function toActorType(source: string): ActivityActorType {
    return source === 'user' ? 'USER' : 'SYSTEM';
}

export async function recordActivity({
    name,
    source,
    status,
    input,
    durationMs,
    errorMessage,
    environmentId,
}: RecordActivityInput): Promise<void> {
    try {
        const [actor, requestContext] = await Promise.all([getCurrentActor(), readRequestContext()]);
        const { resource, action } = splitName(name);
        const { targetId, targetName } = extractTarget(input);

        const row = await prisma.activityLog.create({
            include: ACTIVITY_ACTOR_INCLUDE,
            data: {
                name,
                source,
                status,
                resource,
                action,
                targetType: resource,
                actorType: toActorType(actor.source),
                actorId: actor.userId,
                actorEmail: actor.email,
                actorRole: actor.role,
                organizationId: actor.organizationId,
                targetId,
                targetName,
                environmentId,
                durationMs,
                errorMessage: errorMessage?.slice(0, 1_000),
                ipAddress: requestContext.ipAddress,
                userAgent: requestContext.userAgent,
                metadata: redactMetadata(input) as never,
            },
        });

        publishActivityCreated(toActivityLogEntry(row));
    } catch (error) {
        console.error('[ACTIVITY LOG] Failed to record activity', { name, error });
    }
}
