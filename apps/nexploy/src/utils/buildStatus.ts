import { BuildStatus } from 'generated/client';
import type { PipelineBuild } from '@workspace/typescript-interface/stores/pipelineStore';

export const TERMINAL_STATUSES: BuildStatus[] = ['COMPLETED', 'FAILED', 'CANCELLED'];

export function isBuildLive(status?: string): boolean {
    if (!status) return false;
    return !TERMINAL_STATUSES.includes(status as BuildStatus);
}

export function getBuildDuration(build: PipelineBuild): {
    isRunning: boolean;
    startedAt: number;
    durationMs?: number;
} {
    const isRunning = isBuildLive(build.status);
    const startedAt = new Date(build.createdAt).getTime();

    if (isRunning) {
        return { isRunning, startedAt };
    }

    const finishedAt = build.finishedAt ?? new Date(build.updatedAt).getTime();
    return { isRunning, startedAt, durationMs: Math.max(0, finishedAt - startedAt) };
}
