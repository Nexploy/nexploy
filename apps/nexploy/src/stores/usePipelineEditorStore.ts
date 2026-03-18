import { create } from 'zustand';
import { type NodeRunStatus } from '@/types/pipeline.type';

interface PipelineEditorStore {
    panelNodeId: string | null;
    selectedNodeIds: string[];
    saveVersion: number;
    activeBuildId: string | null;
    builds: Array<{ id: string; [key: string]: unknown }>;
    nodeStatuses: Record<string, NodeRunStatus>;
    hoveredEdgeId: string | null;
    setPanelNodeId: (updater: string | null | ((prev: string | null) => string | null)) => void;
    setSelectedNodeIds: (updater: string[] | ((prev: string[]) => string[])) => void;
    setSaveVersion: (updater: number | ((prev: number) => number)) => void;
    setActiveBuildId: (id: string | null) => void;
    setBuilds: (builds: Array<{ id: string; [key: string]: unknown }>) => void;
    setNodeStatuses: (
        updater:
            | Record<string, NodeRunStatus>
            | ((prev: Record<string, NodeRunStatus>) => Record<string, NodeRunStatus>),
    ) => void;
    setHoveredEdgeId: (id: string | null) => void;
    activeBuild: { id: string; [key: string]: unknown } | undefined;
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
    setBuilds: (builds) => set({ builds }),
    setHoveredEdgeId: (hoveredEdgeId) => set({ hoveredEdgeId }),
    setNodeStatuses: (updater) =>
        set((s) => ({
            nodeStatuses: typeof updater === 'function' ? updater(s.nodeStatuses) : updater,
        })),
    get activeBuild() {
        const { builds, activeBuildId } = get();
        return builds.find((b) => b.id === activeBuildId);
    },
    reset: () => set(INITIAL_STATE),
}));
