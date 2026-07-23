import { existsSync, readdirSync, rmSync, statSync } from 'fs';
import { join } from 'path';
import { isDev } from '@/server/config';

const MAX_TURBOPACK_CACHE_GB = Number(process.env.MAX_TURBOPACK_CACHE_GB ?? 3);
const TURBOPACK_CACHE_DIR = join(process.cwd(), '.next', 'dev', 'cache', 'turbopack');

function dirSizeBytes(dir: string): number {
    let total = 0;

    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        try {
            if (entry.isDirectory()) {
                total += dirSizeBytes(full);
            } else if (entry.isFile()) {
                total += statSync(full).size;
            }
        } catch {}
    }

    return total;
}

export function pruneTurbopackCache(): void {
    if (!isDev || !existsSync(TURBOPACK_CACHE_DIR)) return;

    try {
        const sizeGb = dirSizeBytes(TURBOPACK_CACHE_DIR) / 1024 ** 3;
        if (sizeGb > MAX_TURBOPACK_CACHE_GB) {
            console.warn(
                `🧹 Turbopack cache is ${sizeGb.toFixed(1)}GB (> ${MAX_TURBOPACK_CACHE_GB}GB), clearing it…`,
            );
            rmSync(TURBOPACK_CACHE_DIR, { recursive: true, force: true });
        }
    } catch (err) {
        console.error('⚠️ Failed to inspect/prune Turbopack cache:', err);
    }
}
