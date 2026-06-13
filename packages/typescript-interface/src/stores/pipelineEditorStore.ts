import type { NodeRunStatus } from '../pipeline/node';

export interface PipelineEditorStore {
    panelNodeId: string | null;
    selectedNodeIds: string[];
    saveVersion: number;
    activeBuildId: string | null;
    nodeStatuses: Record<string, NodeRunStatus>;
    hoveredEdgeId: string | null;
    setPanelNodeId: (updater: string | null | ((prev: string | null) => string | null)) => void;
    setSelectedNodeIds: (updater: string[] | ((prev: string[]) => string[])) => void;
    setSaveVersion: (updater: number | ((prev: number) => number)) => void;
    setActiveBuildId: (id: string | null) => void;
    setNodeStatuses: (
        updater:
            | Record<string, NodeRunStatus>
            | ((prev: Record<string, NodeRunStatus>) => Record<string, NodeRunStatus>),
    ) => void;
    setHoveredEdgeId: (id: string | null) => void;
    buildStartTrigger: number;
    triggerBuildRefresh: () => void;
    buildDeleteTrigger: number;
    triggerBuildDelete: () => void;
    reset: () => void;
}
