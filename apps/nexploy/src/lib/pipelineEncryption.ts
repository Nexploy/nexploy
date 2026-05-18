import { decrypt, encrypt } from '@/lib/encryption';
import type { PipelineGraph } from '@workspace/typescript-interface/pipeline/node';

const ENCRYPTED_NODE_FIELDS: Record<string, string[]> = {
    'set-env-vars': ['vars[].value'],
    'send-notification': ['webhookUrl'],
    'update-commit-status': ['token'],
'run-migration': ['databaseUrl'],
    'git-clone-extra': ['token'],
    'http-request': ['headers[].value'],
};

const PREFIX = 'nex:';

function applyToPath(
    obj: Record<string, unknown>,
    path: string,
    fn: (v: string) => string,
): Record<string, unknown> {
    const arrayMatch = /^([^[]+)\[\]\.(.+)$/.exec(path);
    if (arrayMatch) {
        const [, key, subPath] = arrayMatch;
        const arr = obj[key!];
        if (!Array.isArray(arr)) return obj;
        return {
            ...obj,
            [key!]: arr.map((item) =>
                typeof item === 'object' && item !== null
                    ? applyToPath(item as Record<string, unknown>, subPath!, fn)
                    : item,
            ),
        };
    }
    const value = obj[path];
    if (typeof value !== 'string' || !value) return obj;
    return { ...obj, [path]: fn(value) };
}

function transformNodes(
    nodes: PipelineGraph['nodes'],
    fn: (v: string) => string,
): PipelineGraph['nodes'] {
    return nodes.map((node) => {
        const paths = ENCRYPTED_NODE_FIELDS[node.data.type];
        if (!paths) return node;
        const config = paths.reduce((acc, path) => applyToPath(acc, path, fn), node.data.config);
        return { ...node, data: { ...node.data, config } };
    });
}

export function encryptPipelineNodes(nodes: PipelineGraph['nodes']): PipelineGraph['nodes'] {
    return transformNodes(nodes, (v) => (v.startsWith(PREFIX) ? v : encrypt(v)));
}

export function decryptPipelineNodes(nodes: PipelineGraph['nodes']): PipelineGraph['nodes'] {
    return transformNodes(nodes, decrypt);
}
