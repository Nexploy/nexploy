import type { Connection, Edge, EdgeChange, Node, NodeChange } from '@xyflow/react';
import type { NodeId, NodeRunStatus } from '../pipeline/node';

export type PipelineBuildStatus = 'QUEUED' | 'BUILDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface PipelineBuild {
    id: string;
    status: PipelineBuildStatus;
    number: number;
    branch: string | null;
    commitHash: string | null;
    commitMessage: string | null;
    createdAt: Date;
    updatedAt: Date;
    finishedAt?: number;
    pipelineSnapshot?: unknown;
}

export type Snapshot = { nodes: Node[]; edges: Edge[] };

export interface PipelineActionsContextValue {
    setNodes: (nodes: Node[] | ((prev: Node[]) => Node[])) => void;
    setEdges: (edges: Edge[] | ((prev: Edge[]) => Edge[])) => void;
    onNodesChange: (changes: NodeChange<Node>[]) => void;
    onEdgesChange: (changes: EdgeChange[]) => void;
    onConnect: (connection: Connection) => void;
    handleSelectionChange: (selection: { nodes: Node[] }) => void;
    openDialogSettingNode: (id: string) => void;
    handleResetPanelNode: () => void;
    handleConfigChange: (nodeId: string, config: Record<string, unknown>) => void;
    handleNodeAdded: (nodeType: NodeId, nodeId?: string) => void;
    triggerAutoSave: () => void;
    undo: () => void;
    redo: () => void;
    handleDuplicateSelection: () => void;
    handleDeleteSelection: () => void;
    patchBuildOverlay: (buildId: string, partial: Partial<PipelineBuild>) => void;
    setBuildNodeStatuses: (
        buildId: string,
        updater:
            | Record<string, NodeRunStatus>
            | ((prev: Record<string, NodeRunStatus>) => Record<string, NodeRunStatus>),
    ) => void;
    setBuildNodeDurations: (
        buildId: string,
        updater:
            | Record<string, number>
            | ((prev: Record<string, number>) => Record<string, number>),
    ) => void;
    setBuildNodeStartTimes: (
        buildId: string,
        updater:
            | Record<string, number>
            | ((prev: Record<string, number>) => Record<string, number>),
    ) => void;
}

export interface PipelineStateContextValue {
    nodes: Node[];
    edges: Edge[];
    displayNodes: Node[];
    displayEdges: Edge[];
    isViewingBuild: boolean;
    isSaving: boolean;
    activeBuild?: PipelineBuild;
    builds: PipelineBuild[];
    hasMoreBuilds: boolean;
    isLoadingMoreBuilds: boolean;
    loadMoreBuilds: () => void;
    nodeStatuses: Record<string, NodeRunStatus>;
    nodeDurations: Record<string, number>;
    nodeStartTimes: Record<string, number>;
    canUndo: boolean;
    canRedo: boolean;
}

export interface PipelineStoreValue extends PipelineActionsContextValue, PipelineStateContextValue {}

export interface PipelineStoreState {
    nodes: Node[];
    edges: Edge[];
    builds: PipelineBuild[];
    hasMoreBuilds: boolean;
    isLoadingMoreBuilds: boolean;
    loadMoreBuilds: () => void;
    isSaving: boolean;
    canUndo: boolean;
    canRedo: boolean;
    repositoryId: string;
    stageId: string;
    buildOverlays: Record<string, Partial<PipelineBuild>>;
    buildNodeStatuses: Record<string, Record<string, NodeRunStatus>>;
    buildNodeDurations: Record<string, Record<string, number>>;
    buildNodeStartTimes: Record<string, Record<string, number>>;

    setNodes: (nodes: Node[] | ((prev: Node[]) => Node[])) => void;
    setEdges: (edges: Edge[] | ((prev: Edge[]) => Edge[])) => void;
    onNodesChange: (changes: NodeChange<Node>[]) => void;
    onEdgesChange: (changes: EdgeChange[]) => void;
    onConnect: (connection: Connection) => void;
    handleSelectionChange: (selection: { nodes: Node[] }) => void;
    openDialogSettingNode: (id: string) => void;
    handleResetPanelNode: () => void;
    handleConfigChange: (nodeId: string, config: Record<string, unknown>) => void;
    handleNodeAdded: (nodeType: NodeId, nodeId?: string) => void;
    triggerAutoSave: () => void;
    undo: () => void;
    redo: () => void;
    handleDuplicateSelection: () => void;
    handleDeleteSelection: () => void;
    patchBuildOverlay: (buildId: string, partial: Partial<PipelineBuild>) => void;
    setBuildNodeStatuses: (
        buildId: string,
        updater:
            | Record<string, NodeRunStatus>
            | ((prev: Record<string, NodeRunStatus>) => Record<string, NodeRunStatus>),
    ) => void;
    setBuildNodeDurations: (
        buildId: string,
        updater:
            | Record<string, number>
            | ((prev: Record<string, number>) => Record<string, number>),
    ) => void;
    setBuildNodeStartTimes: (
        buildId: string,
        updater:
            | Record<string, number>
            | ((prev: Record<string, number>) => Record<string, number>),
    ) => void;

    _commit: (snapshot: Snapshot) => void;
    _save: () => Promise<void>;
}
