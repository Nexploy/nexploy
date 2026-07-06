import * as fs from 'fs/promises';
import * as path from 'path';
import type { TraefikTreeNode } from './types';
import { TRAEFIK_SERVICE_DIR } from './paths';

export { TRAEFIK_SERVICE_DIR };

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

export async function readTraefikTree(): Promise<TraefikTreeNode[]> {
    await fs.mkdir(TRAEFIK_SERVICE_DIR, { recursive: true });
    return walk(TRAEFIK_SERVICE_DIR, '');
}
