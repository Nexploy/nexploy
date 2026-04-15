import { type NodeFieldRef } from '@workspace/typescript-interface/pipeline/nodeFieldRef';

export function isNodeFieldRef(value: unknown): value is NodeFieldRef {
    return typeof value === 'object' && value !== null && 'nodeId' in value && 'inputKey' in value;
}
