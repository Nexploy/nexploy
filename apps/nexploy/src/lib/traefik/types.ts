export interface TraefikTreeNode {
    /** Last path segment, e.g. `routers.yml` or `apps`. */
    name: string;
    /** Path relative to the Traefik service directory, POSIX separators. */
    path: string;
    type: 'file' | 'folder';
    children?: TraefikTreeNode[];
}
