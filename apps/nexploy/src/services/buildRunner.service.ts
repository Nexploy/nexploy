import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { prisma } from '../../prisma/prisma';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';
import {
    type CreateBuildRunnerInput,
    parseRunnerLabels,
    type UpdateBuildRunnerInput,
} from '@workspace/schemas-zod/buildRunner/buildRunner.schema';
import type { BuildRunnerInfo, BuildRunnerWithToken } from '@workspace/typescript-interface/buildRunner/buildRunner';

const TOKEN_PREFIX = 'nxr_';
const TOKEN_BYTES = 32;
const ONLINE_WINDOW_MS = 90_000;

const runnerSelect = {
    id: true,
    name: true,
    description: true,
    tokenPrefix: true,
    labels: true,
    maxConcurrency: true,
    enabled: true,
    status: true,
    lastSeenAt: true,
    version: true,
    platforms: true,
    activeJobs: true,
    createdAt: true,
} as const;

function generateToken(): { token: string; tokenHash: string; tokenPrefix: string } {
    const token = `${TOKEN_PREFIX}${randomBytes(TOKEN_BYTES).toString('hex')}`;

    return {
        token,
        tokenHash: hashToken(token),
        tokenPrefix: token.slice(0, TOKEN_PREFIX.length + 8),
    };
}

export function hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
}

function markStale(runner: BuildRunnerInfo): BuildRunnerInfo {
    const seenRecently = runner.lastSeenAt !== null && Date.now() - runner.lastSeenAt.getTime() < ONLINE_WINDOW_MS;

    if (runner.status !== 'OFFLINE' && !seenRecently) {
        return { ...runner, status: 'OFFLINE', activeJobs: 0 };
    }

    return runner;
}

export async function getBuildRunners(): Promise<BuildRunnerInfo[]> {
    const t = await getErrorTranslator();

    try {
        const runners = await prisma.buildRunner.findMany({
            select: runnerSelect,
            orderBy: { createdAt: 'asc' },
        });

        return runners.map(markStale);
    } catch {
        throw new Error(t('buildRunner.getFailed'));
    }
}

export async function getBuildRunnerById(id: string): Promise<BuildRunnerInfo | null> {
    const runner = await prisma.buildRunner.findUnique({ where: { id }, select: runnerSelect });
    return runner ? markStale(runner) : null;
}

export async function createBuildRunner(
    data: CreateBuildRunnerInput,
    createdById: string,
): Promise<BuildRunnerWithToken> {
    const t = await getErrorTranslator();
    const { token, tokenHash, tokenPrefix } = generateToken();

    try {
        const runner = await prisma.buildRunner.create({
            data: {
                name: data.name,
                description: data.description || null,
                labels: parseRunnerLabels(data.labels),
                maxConcurrency: data.maxConcurrency,
                tokenHash,
                tokenPrefix,
                createdById,
            },
            select: runnerSelect,
        });

        return { runner, token };
    } catch (error: unknown) {
        if (isUniqueViolation(error)) {
            throw new Error(t('buildRunner.nameTaken'));
        }
        throw new Error(t('buildRunner.createFailed'));
    }
}

export async function updateBuildRunner(data: UpdateBuildRunnerInput): Promise<BuildRunnerInfo> {
    const t = await getErrorTranslator();

    try {
        const runner = await prisma.buildRunner.update({
            where: { id: data.id },
            data: {
                name: data.name,
                description: data.description || null,
                labels: parseRunnerLabels(data.labels),
                maxConcurrency: data.maxConcurrency,
                enabled: data.enabled,
            },
            select: runnerSelect,
        });

        return markStale(runner);
    } catch (error: unknown) {
        if (isUniqueViolation(error)) {
            throw new Error(t('buildRunner.nameTaken'));
        }
        throw new Error(t('buildRunner.updateFailed'));
    }
}

export async function deleteBuildRunner(id: string): Promise<void> {
    const t = await getErrorTranslator();

    try {
        await prisma.buildRunner.delete({ where: { id } });
    } catch {
        throw new Error(t('buildRunner.deleteFailed'));
    }
}

export async function regenerateBuildRunnerToken(id: string): Promise<BuildRunnerWithToken> {
    const t = await getErrorTranslator();
    const { token, tokenHash, tokenPrefix } = generateToken();

    try {
        const runner = await prisma.buildRunner.update({
            where: { id },
            data: { tokenHash, tokenPrefix, status: 'OFFLINE', lastSeenAt: null, activeJobs: 0 },
            select: runnerSelect,
        });

        return { runner, token };
    } catch {
        throw new Error(t('buildRunner.regenerateFailed'));
    }
}

export async function markBuildRunnerOnline(
    id: string,
    details: { version?: string; platforms?: string[]; maxConcurrency?: number },
): Promise<void> {
    await prisma.buildRunner
        .update({
            where: { id },
            data: {
                status: 'ONLINE',
                lastSeenAt: new Date(),
                activeJobs: 0,
                version: details.version ?? null,
                ...(details.platforms && { platforms: details.platforms }),
                ...(details.maxConcurrency && { maxConcurrency: details.maxConcurrency }),
            },
        })
        .catch(() => undefined);
}

export async function markBuildRunnerOffline(id: string): Promise<void> {
    await prisma.buildRunner
        .update({ where: { id }, data: { status: 'OFFLINE', activeJobs: 0 } })
        .catch(() => undefined);
}

export async function touchBuildRunner(id: string, activeJobs: number, draining: boolean): Promise<void> {
    await prisma.buildRunner
        .update({
            where: { id },
            data: { status: draining ? 'DRAINING' : 'ONLINE', lastSeenAt: new Date(), activeJobs },
        })
        .catch(() => undefined);
}

export async function verifyBuildRunnerToken(token: string): Promise<BuildRunnerInfo | null> {
    if (!token.startsWith(TOKEN_PREFIX)) return null;

    const candidate = await prisma.buildRunner.findUnique({
        where: { tokenHash: hashToken(token) },
        select: { ...runnerSelect, tokenHash: true },
    });

    if (!candidate || !candidate.enabled) return null;

    const expected = Buffer.from(candidate.tokenHash, 'hex');
    const provided = Buffer.from(hashToken(token), 'hex');

    if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) return null;

    const { tokenHash: _tokenHash, ...runner } = candidate;

    return runner;
}

function isUniqueViolation(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
}
