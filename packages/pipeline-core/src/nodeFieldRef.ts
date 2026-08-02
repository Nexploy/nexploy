export interface NodeFieldRef {
    nodeId: string;
    inputKey: string;
    labelKey: string;
    nodeType?: string;
}

export function isNodeFieldRef(value: unknown): value is NodeFieldRef {
    return typeof value === 'object' && value !== null && 'nodeId' in value && 'inputKey' in value;
}
