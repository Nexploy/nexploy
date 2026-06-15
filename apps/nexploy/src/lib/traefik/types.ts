export interface TraefikTreeNode {
    name: string;
    path: string;
    type: 'file' | 'folder';
    children?: TraefikTreeNode[];
}
