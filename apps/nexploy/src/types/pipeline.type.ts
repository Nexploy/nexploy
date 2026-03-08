import { BuildConfig } from '@workspace/typescript-interface/inngest/build';

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

export type PipelineStatus =
    | 'QUEUED'
    | 'BUILDING'
    | 'DEPLOYING'
    | 'COMPLETED'
    | 'FAILED'
    | 'CANCELLED';

export type NodeOutputData = Record<string, unknown>;

export type NodeOutputStore = Map<string, NodeOutputData>;

export interface NodeExecutionContext {
    buildId: string;
    config: BuildConfig;
    nodeId: string;
    nodeConfig: Record<string, unknown>;
    inputOutputs: NodeOutputData[];
    allOutputs: NodeOutputStore;
    logger: PipelineLogger;
    reporter: StatusReporter;
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

export type NodeRunStatus = 'running' | 'completed' | 'skipped' | 'failed';

export interface StatusReporter {
    setStatus(status: PipelineStatus): Promise<void>;
    markNodeCompleted(nodeId: string): Promise<void>;
    markNodeRunning(nodeId: string): Promise<void>;
    markNodeSkipped(nodeId: string): Promise<void>;
    markNodeFailed(nodeId: string): Promise<void>;
}

export interface InngestStepRunner {
    run<T>(id: string, fn: () => Promise<T>): Promise<unknown>;
}

export interface PipelineResult {
    success: boolean;
    error?: string;
    completedNodes: string[];
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
