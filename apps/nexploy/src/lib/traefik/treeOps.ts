import type { TraefikTreeNode } from './types';

export function collectFolderPaths(nodes: TraefikTreeNode[], acc: string[] = []): string[] {
    for (const node of nodes) {
        if (node.type === 'folder') {
            acc.push(node.path);
            if (node.children) collectFolderPaths(node.children, acc);
        }
    }
    return acc;
}

export function buildPathMap(
    nodes: TraefikTreeNode[],
    map: Map<string, TraefikTreeNode> = new Map(),
): Map<string, TraefikTreeNode> {
    for (const node of nodes) {
        map.set(node.path, node);
        if (node.children) buildPathMap(node.children, map);
    }
    return map;
}

function sortNodes(nodes: TraefikTreeNode[]): TraefikTreeNode[] {
    return [...nodes].sort((a, b) => {
        if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
        return a.name.localeCompare(b.name);
    });
}

export function insertFileNode(tree: TraefikTreeNode[], filePath: string): TraefikTreeNode[] {
    const segments = filePath.split('/');
    const popped = segments.pop();
    if (!popped) return tree;
    const fileName: string = popped;

    function insertInto(
        nodes: TraefikTreeNode[],
        segs: string[],
        prefix: string,
    ): TraefikTreeNode[] {
        const [head, ...rest] = segs;
        if (!head) {
            const path = prefix ? `${prefix}/${fileName}` : fileName;
            if (nodes.some((n) => n.path === path)) return nodes;
            return sortNodes([...nodes, { name: fileName, path, type: 'file' }]);
        }

        const folderPath = prefix ? `${prefix}/${head}` : head;
        const idx = nodes.findIndex((n) => n.type === 'folder' && n.name === head);
        const existing = idx === -1 ? undefined : nodes[idx];

        if (!existing) {
            const newFolder: TraefikTreeNode = {
                name: head,
                path: folderPath,
                type: 'folder',
                children: insertInto([], rest, folderPath),
            };
            return sortNodes([...nodes, newFolder]);
        }

        const copy = [...nodes];
        copy[idx] = {
            ...existing,
            children: insertInto(existing.children ?? [], rest, folderPath),
        };
        return copy;
    }

    return insertInto(tree, segments, '');
}

export function removeNode(tree: TraefikTreeNode[], targetPath: string): TraefikTreeNode[] {
    function removeFrom(nodes: TraefikTreeNode[]): TraefikTreeNode[] {
        return nodes
            .filter((n) => n.path !== targetPath)
            .map((n) => (n.children ? { ...n, children: removeFrom(n.children) } : n));
    }
    return removeFrom(tree);
}
