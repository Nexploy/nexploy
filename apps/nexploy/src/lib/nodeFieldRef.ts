import { type NodeFieldRef } from '@workspace/typescript-interface/pipeline/nodeFieldRef';

const REF_PATTERN = /^\$\{([^,}]+),([^}]+)\}$/;

export function isNodeFieldRef(value: unknown): value is NodeFieldRef {
    return typeof value === 'object' && value !== null && 'nodeId' in value && 'inputKey' in value;
}

export function parseRefString(value?: string): NodeFieldRef | null {
    const match = value?.match(REF_PATTERN);
    if (!match) return null;
    return {
        nodeId: match[1]!,
        inputKey: match[2]!,
    };
}

export function isRefString(value: string): boolean {
    return REF_PATTERN.test(value);
}

export function stringifyRef(ref: NodeFieldRef): string {
    return `\${${ref.nodeId},${ref.inputKey}}`;
}
