import { readdir, stat } from 'fs/promises';
import { join } from 'path';

async function getDirSize(dir: string): Promise<number> {
    try {
        const entries = await readdir(dir, { withFileTypes: true });
        const sizes = await Promise.all(
            entries.map(async (entry) => {
                const full = join(dir, entry.name);
                if (entry.isDirectory()) {
                    return getDirSize(full);
                }
                const s = await stat(full);
                return s.size;
            }),
        );
        return sizes.reduce((acc, size) => acc + size, 0);
    } catch {
        return 0;
    }
}

export async function getRepositoryCacheSize(repositoryId: string): Promise<number> {
    const workDir = process.env.DEPLOYER_WORK_DIR;
    if (!workDir) return 0;
    return getDirSize(join(workDir, repositoryId));
}
