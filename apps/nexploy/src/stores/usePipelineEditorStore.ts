import { create } from 'zustand';
import { type NodeRunStatus } from '@/types/pipeline.type';

interface PipelineEditorStore {
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
    reset: () => void;
}

const INITIAL_STATE = {
    panelNodeId: null,
    selectedNodeIds: [] as string[],
    saveVersion: 0,
    activeBuildId: null,
    builds: [],
    nodeStatuses: {} as Record<string, NodeRunStatus>,
    hoveredEdgeId: null,
    buildStartTrigger: 0,
};

export const usePipelineEditorStore = create<PipelineEditorStore>((set, get) => ({
    ...INITIAL_STATE,
    setPanelNodeId: (updater) =>
        set((s) => ({
            panelNodeId: typeof updater === 'function' ? updater(s.panelNodeId) : updater,
        })),
    setSelectedNodeIds: (updater) =>
        set((s) => ({
            selectedNodeIds: typeof updater === 'function' ? updater(s.selectedNodeIds) : updater,
        })),
    setSaveVersion: (updater) =>
        set((s) => ({
            saveVersion: typeof updater === 'function' ? updater(s.saveVersion) : updater,
        })),
    setActiveBuildId: (activeBuildId) => set({ activeBuildId }),
    triggerBuildRefresh: () => set((s) => ({ buildStartTrigger: s.buildStartTrigger + 1 })),
    setHoveredEdgeId: (hoveredEdgeId) => {
        if (get().hoveredEdgeId === hoveredEdgeId) return;
        set({ hoveredEdgeId });
    },
    setNodeStatuses: (updater) =>
        set((s) => ({
            nodeStatuses: typeof updater === 'function' ? updater(s.nodeStatuses) : updater,
        })),
    reset: () => set(INITIAL_STATE),
}));
