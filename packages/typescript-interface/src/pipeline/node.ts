import { NodeDefinition } from './nodeDefinition';

export type MinimalNode = { id: string; data: { disabled?: boolean } };
export type MinimalEdge = { source: string; target: string };

export type NodeRunStatus =
    | 'running'
    | 'completed'
    | 'skipped'
    | 'failed'
    | 'cancelled'
    | 'not-configured';

export interface NodeData {
    nodeType: string;
    definition: NodeDefinition;
    config: Record<string, any>;
    disabled?: boolean;
    viewOnly?: boolean;
    status?: NodeRunStatus;
}

export type NodeId =
    | 'clone-repository'
    | 'webhook-clone'
    | 'build-docker-image'
    | 'deploy-compose'
    | 'push-to-registry'
    | 'pull-from-registry'
    | 'validate-dockerfile'
    | 'validate-compose'
    | 'env-vars'
    | 'set-env-vars'
    | 'clean-workdir'
    | 'send-notification'
    | 'save-version'
    | 'set-environment'
    | 'start-container'
    | 'stop-container'
    | 'restart-container'
    | 'remove-container'
    | 'create-container'
    | 'create-network'
    | 'create-volume'
    // Flow Control
    | 'wait-for-health'
    | 'wait-for-url'
    | 'wait-for-port'
    | 'delay'
    | 'condition'
    // Script Execution
    | 'run-script'
    | 'run-command-in-container'
    | 'run-tests'
    // HTTP / Webhooks
    | 'http-request'
    | 'update-commit-status'
    // Image Management
    | 'tag-image'
    | 'scan-image'
    | 'prune-images'
    | 'delete-image'
    | 'delete-network'
    | 'delete-volume'
    // Files & Artifacts
    | 'template-file'
    | 'upload-artifact'
    | 'download-file'
    // Database
    | 'run-migration'
    | 'backup-volume-s3'
    // Docker Swarm
    | 'update-service'
    | 'scale-service'
    // Monitoring
    | 'check-container-logs'
    // Cache
    | 'cache-restore'
    | 'cache-save'
    // Git
    | 'git-tag'
    | 'git-clone-extra'
    | 'create-release'
    | 'cherry-pick-commit'
    | 'merge-branch'
    | 'generate-changelog'
    // Secrets
    | 'fetch-secrets'
    // Code Quality
    | 'sonarqube-scan';

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

export interface NodeLifecycleCallbacks {
    onAdd?: (repositoryId: string) => Promise<void>;
    onRemove?: (repositoryId: string, remainingNodesOfType: number) => Promise<void>;
}
