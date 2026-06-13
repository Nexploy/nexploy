export interface PipelineEditorStore {
    panelNodeId: string | null;
    selectedNodeIds: string[];
    activeBuildId: string | null;
    hoveredEdgeId: string | null;
    setPanelNodeId: (updater: string | null | ((prev: string | null) => string | null)) => void;
    setSelectedNodeIds: (updater: string[] | ((prev: string[]) => string[])) => void;
    setActiveBuildId: (id: string | null) => void;
    setHoveredEdgeId: (id: string | null) => void;
    buildStartTrigger: number;
    triggerBuildRefresh: () => void;
    buildDeleteTrigger: number;
    triggerBuildDelete: () => void;
}
