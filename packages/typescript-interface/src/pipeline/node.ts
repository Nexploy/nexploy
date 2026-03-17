import { NodeDefinition } from './nodeDefinition';

export type NodeRunStatus = 'running' | 'completed' | 'skipped' | 'failed';

export interface NodeData {
    nodeType: string;
    definition: NodeDefinition;
    config: Record<string, unknown>;
    disabled?: boolean;
    viewOnly?: boolean;
    status?: NodeRunStatus;
}

export type NodeId =
    | 'clone-repository'
    | 'build-docker-image'
    | 'deploy-container'
    | 'deploy-compose'
    | 'push-to-registry'
    | 'validate-dockerfile'
    | 'validate-compose'
    | 'write-env-file'
    | 'set-env-vars'
    | 'clean-workdir'
    | 'send-notification'
    | 'save-version';

export type NodeType = 'base-node' | 'large-node' | 'attach-node';

export type NodeCategory = 'source' | 'build' | 'deploy' | 'utility' | 'notification';

export interface PipelineNodeData {
    type: NodeId;
    config: Record<string, unknown>;
    disabled?: boolean;
    isStartNode?: boolean;
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
