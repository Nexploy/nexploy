import { BuildStatus } from 'generated/client';

export const TERMINAL_STATUSES: BuildStatus[] = ['COMPLETED', 'FAILED', 'CANCELLED'];

export function isBuildLive(status?: string): boolean {
    if (!status) return false;
    return !TERMINAL_STATUSES.includes(status as BuildStatus);
}
