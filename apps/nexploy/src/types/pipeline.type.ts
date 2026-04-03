import { BuildConfig } from '@workspace/typescript-interface/inngest/build';
import { PipelineEdge } from '@workspace/typescript-interface/pipeline/node';

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

export type PipelineStatus = 'QUEUED' | 'BUILDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export type NodeOutputData = Record<string, unknown>;

export type NodeOutputStore = Map<string, NodeOutputData>;

export interface InputNodeInfo {
    id: string;
    type: string;
}

export interface NodeExecutionContext {
    buildId: string;
    config: BuildConfig;
    nodeId: string;
    nodeConfig: Record<string, unknown>;
    inputNodes: InputNodeInfo[];
    inputOutputs: NodeOutputData[];
    allOutputs: NodeOutputStore;
    edges: PipelineEdge[];
    logger: PipelineLogger;
    reporter: PipelineReporter;
    abortSignal: AbortSignal;
}

export interface NodeExecutionResult {
    success: boolean;
    output: NodeOutputData;
    skipped?: boolean;
}

export interface INodeExecutor {
    readonly type: string;
    execute(ctx: NodeExecutionContext): Promise<NodeExecutionResult>;
}

export interface PipelineLogger {
    log(step: string, message: string, level?: LogLevel): Promise<void>;
    debug(step: string, message: string): Promise<void>;
    info(step: string, message: string): Promise<void>;
    warn(step: string, message: string): Promise<void>;
    error(step: string, message: string): Promise<void>;
}

export type { NodeRunStatus } from '@workspace/typescript-interface/pipeline/node';

export interface CommitInfo {
    branch: string;
    commitHash?: string;
    commitMessage?: string;
}

export interface PipelineReporter {
    markCompleted(nodeId: string): Promise<void>;
    markRunning(nodeId: string): Promise<void>;
    markSkipped(nodeId: string): Promise<void>;
    markFailed(nodeId: string): Promise<void>;
    markCancelled(nodeId: string): Promise<void>;
    publishCommitInfo(data: CommitInfo): Promise<void>;
}

export interface InngestStepRunner {
    run<T>(id: string, fn: () => Promise<T>): Promise<unknown>;
}

export interface PipelineResult {
    success: boolean;
    error?: string;
}

export type ProgressCallback = (progress: number, message: string) => void | Promise<void>;

export interface SSEEvent {
    type: 'log' | 'error' | 'complete';
    message?: string;
    result?: unknown;
    timestamp?: string;
}

export function getFromInputs<T>(inputOutputs: NodeOutputData[], key: string): T | undefined {
    for (const output of inputOutputs) {
        if (key in output) return output[key] as T;
    }
    return undefined;
}

export function getFromAllOutputs<T>(allOutputs: NodeOutputStore, key: string): T | undefined {
    for (const output of allOutputs.values()) {
        if (key in output) return output[key] as T;
    }
    return undefined;
}

/**
 * BFS backwards through the graph from nodeId.
 * Returns the value from the closest ancestor that has the given key.
 */
export function getFromClosestAncestor<T>(
    allOutputs: NodeOutputStore,
    edges: PipelineEdge[],
    nodeId: string,
    key: string,
): T | undefined {
    const visited = new Set<string>();
    const queue: string[] = [nodeId];

    while (queue.length > 0) {
        const current = queue.shift()!;
        if (visited.has(current)) continue;
        visited.add(current);

        const parents = edges.filter((e) => e.target === current).map((e) => e.source);
        for (const parentId of parents) {
            const output = allOutputs.get(parentId);
            if (output && key in output) return output[key] as T;
            queue.push(parentId);
        }
    }

    return undefined;
}
