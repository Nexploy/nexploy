import { create } from 'zustand';
import type { NodeRunStatus } from '@workspace/typescript-interface/pipeline/node';
import type { PipelineEditorStore } from '@workspace/typescript-interface/stores/pipelineEditorStore';

const INITIAL_STATE = {
    panelNodeId: null,
    selectedNodeIds: [] as string[],
    saveVersion: 0,
    activeBuildId: null,
    builds: [],
    nodeStatuses: {} as Record<string, NodeRunStatus>,
    hoveredEdgeId: null,
    buildStartTrigger: 0,
    buildDeleteTrigger: 0,
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
    triggerBuildDelete: () => set((s) => ({ buildDeleteTrigger: s.buildDeleteTrigger + 1 })),
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
