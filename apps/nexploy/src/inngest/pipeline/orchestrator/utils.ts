import { type NodeFieldRef } from '@workspace/typescript-interface/pipeline/nodeFieldRef';
import { type PipelineEdge } from '@workspace/typescript-interface/pipeline/node';
import { type NodeOutputStore, type LogLevel } from '@/types/pipeline.type';
import { isNodeFieldRef } from '@/lib/nodeFieldRef';

export function formatErrorDetails(error: unknown): string {
    if (error instanceof Error) {
        const details = [`Error: ${error.message}`, `Name: ${error.name}`];
        if (process.env.NODE_ENV !== 'production') {
            if (error.stack) details.push(`Stack trace:\n${error.stack}`);
            const extra = Object.entries(error)
                .filter(([k]) => !['message', 'name', 'stack'].includes(k))
                .map(([k, v]) => `${k}: ${JSON.stringify(v)}`);
            if (extra.length) details.push(`Additional info:\n${extra.join('\n')}`);
        }
        return details.join('\n');
    }
    return `Unknown error: ${JSON.stringify(error, null, 2)}`;
}

export function getInputNodeIds(nodeId: string, edges: PipelineEdge[]): string[] {
    return edges.filter((e) => e.target === nodeId).map((e) => e.source);
}

function resolveValue(
    value: unknown,
    allOutputs: NodeOutputStore,
    nodeTypeMap: Map<string, string>,
    warnings: Set<string>,
): unknown {
    if (isNodeFieldRef(value)) {
        const ref = value as NodeFieldRef;
        const nodeOutput = allOutputs.get(ref.nodeId);
        const resolved = nodeOutput?.[ref.inputKey];
        if (resolved === undefined) {
            const sourceType = ref.nodeType ?? nodeTypeMap.get(ref.nodeId) ?? ref.nodeId;
            warnings.add(
                `Input "${ref.inputKey}" from "${sourceType}" is unavailable — the source node was deleted or disabled`,
            );
        }
        return resolved;
    }
    if (Array.isArray(value)) {
        return value.map((item) => resolveValue(item, allOutputs, nodeTypeMap, warnings));
    }
    if (typeof value === 'object' && value !== null) {
        return Object.fromEntries(
            Object.entries(value as Record<string, unknown>).map(([k, v]) => [
                k,
                resolveValue(v, allOutputs, nodeTypeMap, warnings),
            ]),
        );
    }
    return value;
}

export function resolveConfigRefs(
    config: Record<string, unknown>,
    allOutputs: NodeOutputStore,
    nodeTypeMap: Map<string, string>,
): { resolved: Record<string, unknown>; warnings: string[] } {
    const warnings = new Set<string>();
    const resolved = Object.fromEntries(
        Object.entries(config).map(([key, value]) => [
            key,
            resolveValue(value, allOutputs, nodeTypeMap, warnings),
        ]),
    );
    return { resolved, warnings: [...warnings] };
}

export function createPipelineLogger(
    publishLog: (step: string, message: string, level: LogLevel) => Promise<void>,
) {
    return {
        log: publishLog,
        debug: (step: string, message: string) => publishLog(step, message, 'DEBUG'),
        info: (step: string, message: string) => publishLog(step, message, 'INFO'),
        warn: (step: string, message: string) => publishLog(step, message, 'WARN'),
        error: (step: string, message: string) => publishLog(step, message, 'ERROR'),
    };
}
