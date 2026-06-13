import { type NodeFieldRef } from '@workspace/typescript-interface/pipeline/nodeFieldRef';
import { type LogLevel, type NodeOutputStore } from '@/types/pipeline.type';
import { isNodeFieldRef } from '@/lib/nodeFieldRef';

export function formatErrorDetails(error: unknown): string {
    if (!(error instanceof Error)) {
        return `Unknown error: ${JSON.stringify(error, null, 2)}`;
    }

    const lines = [`Error: ${error.message}`, `Name: ${error.name}`];

    if (error.stack) {
        lines.push(`Stack trace:\n${error.stack}`);
    }

    const extraProps = Object.entries(error).filter(
        ([key]) => !['message', 'name', 'stack'].includes(key),
    );
    if (extraProps.length > 0) {
        lines.push(
            `Additional info:\n${extraProps.map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join('\n')}`,
        );
    }

    return lines.join('\n');
}

function resolveFieldValue(
    value: unknown,
    allOutputs: NodeOutputStore,
    nodeTypeMap: Map<string, string>,
    warnings: Set<string>,
): unknown {
    if (isNodeFieldRef(value)) {
        return resolveRef(value as NodeFieldRef, allOutputs, nodeTypeMap, warnings);
    }

    if (Array.isArray(value)) {
        return value.map((item) => resolveFieldValue(item, allOutputs, nodeTypeMap, warnings));
    }

    if (typeof value === 'object' && value !== null) {
        return Object.fromEntries(
            Object.entries(value as Record<string, unknown>).map(([key, val]) => [
                key,
                resolveFieldValue(val, allOutputs, nodeTypeMap, warnings),
            ]),
        );
    }

    return value;
}

function resolveRef(
    ref: NodeFieldRef,
    allOutputs: NodeOutputStore,
    nodeTypeMap: Map<string, string>,
    warnings: Set<string>,
): unknown {
    const sourceOutput = allOutputs.get(ref.nodeId);
    const resolvedValue = sourceOutput?.[ref.inputKey];

    if (resolvedValue === undefined) {
        const sourceLabel = ref.nodeType ?? nodeTypeMap.get(ref.nodeId) ?? ref.nodeId;
        if (!sourceOutput) {
            warnings.add(
                `Field "${ref.inputKey}" from node "${sourceLabel}" (id: ${ref.nodeId}) is unavailable — the source node produced no output (deleted or disabled)`,
            );
        } else {
            warnings.add(
                `Field "${ref.inputKey}" from node "${sourceLabel}" (id: ${ref.nodeId}) is unavailable — the field does not exist in the source node's output (available fields: ${Object.keys(sourceOutput).join(", ") || "none"})`,
            );
        }
    }

    return resolvedValue;
}

export function resolveNodeConfig(
    config: Record<string, unknown>,
    allOutputs: NodeOutputStore,
    nodeTypeMap: Map<string, string>,
): { resolved: Record<string, unknown>; warnings: string[] } {
    const warnings = new Set<string>();

    const resolved = Object.fromEntries(
        Object.entries(config).map(([key, value]) => [
            key,
            resolveFieldValue(value, allOutputs, nodeTypeMap, warnings),
        ]),
    );

    return { resolved, warnings: [...warnings] };
}

export function createPipelineLogger(
    publishLog: (step: string, message: string, level: LogLevel) => Promise<void>,
    flush: () => Promise<void> = async () => {},
) {
    return {
        log: publishLog,
        debug: (step: string, message: string) => publishLog(step, message, 'DEBUG'),
        info: (step: string, message: string) => publishLog(step, message, 'INFO'),
        warn: (step: string, message: string) => publishLog(step, message, 'WARN'),
        error: (step: string, message: string) => publishLog(step, message, 'ERROR'),
        flush,
    };
}
