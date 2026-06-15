import * as fs from 'fs/promises';
import * as path from 'path';
import type { TraefikTreeNode } from './types';

export const TRAEFIK_SERVICE_DIR = path.join(
    process.cwd(),
    '..',
    '..',
    'infra',
    'traefik',
    'service',
);

/**
 * Resolve a path relative to the Traefik service directory while preventing
 * traversal outside of it. Returns the absolute path, or `null` if invalid.
 */
export function resolveTraefikPath(relPath: string): string | null {
    if (!relPath || relPath.includes('\0')) return null;
    const normalized = path.normalize(relPath);
    if (normalized.split(/[/\\]/).some((seg) => seg === '..')) return null;
    const full = path.resolve(TRAEFIK_SERVICE_DIR, normalized);
    if (full !== TRAEFIK_SERVICE_DIR && !full.startsWith(TRAEFIK_SERVICE_DIR + path.sep)) {
        return null;
    }
    return full;
}

/** Resolve a `.yml` file path, returning `null` for non-yml or unsafe paths. */
export function resolveTraefikYmlPath(relPath: string): string | null {
    if (!relPath.endsWith('.yml')) return null;
    return resolveTraefikPath(relPath);
}

async function walk(absDir: string, relDir: string): Promise<TraefikTreeNode[]> {
    const entries = await fs.readdir(absDir, { withFileTypes: true });
    const nodes: TraefikTreeNode[] = [];

    for (const entry of entries) {
        const relPath = relDir ? `${relDir}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
            const children = await walk(path.join(absDir, entry.name), relPath);
            nodes.push({ name: entry.name, path: relPath, type: 'folder', children });
        } else if (entry.isFile() && entry.name.endsWith('.yml')) {
            nodes.push({ name: entry.name, path: relPath, type: 'file' });
        }
    }

    nodes.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
        return a.name.localeCompare(b.name);
    });

    return nodes;
}

/** Build a hierarchical tree of folders and `.yml` files. */
export async function readTraefikTree(): Promise<TraefikTreeNode[]> {
    await fs.mkdir(TRAEFIK_SERVICE_DIR, { recursive: true });
    return walk(TRAEFIK_SERVICE_DIR, '');
}
