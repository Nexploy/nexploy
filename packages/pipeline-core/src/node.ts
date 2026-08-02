import type { NodeClientServices } from '@workspace/pipeline-core/nodeServices';

export type MinimalNode = { id: string; data: { disabled?: boolean } };
export type MinimalEdge = { source: string; target: string };

export type NodeRunStatus = 'running' | 'completed' | 'skipped' | 'failed' | 'cancelled' | 'not-configured';

export type NodeId = string;

export type NodeType = 'base-node' | 'large-node' | 'attach-node';

export type NodeCategory =
    | 'source'
    | 'build'
    | 'deploy'
    | 'script'
    | 'database'
    | 'flow'
    | 'config'
    | 'files'
    | 'integration'
    | 'utility';

export interface NodeGraphData {
    nodeType: string;
    config: Record<string, any>;
    disabled?: boolean;
    viewOnly?: boolean;
    status?: NodeRunStatus;
    durationMs?: number;
}

export interface PipelineNodeData {
    type: NodeId;
    config: Record<string, unknown>;
    disabled?: boolean;
    isStartNode?: boolean;
    isEndNode?: boolean;
}

export interface PipelineNode {
    id: string;
    type: NodeId;
    position: { x: number; y: number };
    data: PipelineNodeData;
}

export interface PipelineEdge {
    id: string;
    source: string;
    sourceHandle?: string;
    target: string;
    targetHandle?: string;
}

export interface PipelineGraph {
    nodes: PipelineNode[];
    edges: PipelineEdge[];
}

export interface NodeLifecycleContext {
    repositoryId: string;
    remainingNodesOfType: number;
    services: NodeClientServices;
}

export interface NodeLifecycleCallbacks {
    onAdd?: (ctx: NodeLifecycleContext) => Promise<void>;
    onRemove?: (ctx: NodeLifecycleContext) => Promise<void>;
}
