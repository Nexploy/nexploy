import { create } from 'zustand';
import type { PipelineEditorStore } from '@workspace/typescript-interface/stores/pipelineEditorStore';

const INITIAL_STATE = {
    panelNodeId: null,
    selectedNodeIds: [] as string[],
    activeBuildId: null,
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
    setActiveBuildId: (activeBuildId) => set({ activeBuildId }),
    triggerBuildRefresh: () => set((s) => ({ buildStartTrigger: s.buildStartTrigger + 1 })),
    triggerBuildDelete: () => set((s) => ({ buildDeleteTrigger: s.buildDeleteTrigger + 1 })),
    setHoveredEdgeId: (hoveredEdgeId) => {
        if (get().hoveredEdgeId === hoveredEdgeId) return;
        set({ hoveredEdgeId });
    },
}));
