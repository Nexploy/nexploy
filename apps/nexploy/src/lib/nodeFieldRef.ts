import { type NodeFieldRef } from '@workspace/typescript-interface/pipeline/nodeFieldRef';

export function isNodeFieldRef(value: unknown): value is NodeFieldRef {
    return (
        typeof value === 'object' &&
        value !== null &&
        '__nexploy_ref' in value &&
        (value as NodeFieldRef).__nexploy_ref === true
    );
}
