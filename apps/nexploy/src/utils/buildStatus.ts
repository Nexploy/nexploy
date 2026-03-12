import { BuildStatus } from 'generated/client';

export const TERMINAL_STATUSES: BuildStatus[] = ['COMPLETED', 'FAILED', 'CANCELLED'];

export function isBuildLive(status?: BuildStatus): boolean {
    if (!status) return false;
    return !TERMINAL_STATUSES.includes(status);
}
