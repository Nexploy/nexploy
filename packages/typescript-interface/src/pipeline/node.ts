export type NodeType =
    | 'clone-repository'
    | 'build-docker-image'
    | 'deploy-container'
    | 'write-env-file'
    | 'run-script'
    | 'send-notification';

export type NodeCategory = 'source' | 'build' | 'deploy' | 'utility' | 'notification';

export interface PipelineNodeData {
    type: NodeType;
    config: Record<string, unknown>;
    label?: string;
}

export interface PipelineNode {
    id: string;
    type: NodeType;
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
