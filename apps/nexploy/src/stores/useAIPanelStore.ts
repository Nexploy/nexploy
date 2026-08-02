import { create } from 'zustand/react';
import { persist } from 'zustand/middleware';
import type { AIPanelStore } from '@workspace/typescript-interface/stores/aiPanelStore';

export const useAIPanelStore = create<AIPanelStore>()(
    persist(
        (set) => ({
            isOpen: false,
            pendingPrompt: null,
            selectedModel: null,
            modelSelectorOpen: false,
            isFullscreen: false,
            aiEnabled: true,
            openPanel: (prompt) => set({ isOpen: true, pendingPrompt: prompt ?? null }),
            closePanel: () => set({ isOpen: false, modelSelectorOpen: false, isFullscreen: false }),
            clearPendingPrompt: () => set({ pendingPrompt: null }),
            setSelectedModel: (model) => set({ selectedModel: model }),
            openModelSelector: () => set({ modelSelectorOpen: true }),
            closeModelSelector: () => set({ modelSelectorOpen: false }),
            setFullscreen: (fullscreen) => set({ isFullscreen: fullscreen }),
            toggleFullscreen: () => set((state) => ({ isFullscreen: !state.isFullscreen })),
            setAiEnabled: (enabled) => set({ aiEnabled: enabled }),
        }),
        {
            name: 'ai-panel',
            partialize: (state) => ({ selectedModel: state.selectedModel }),
        },
    ),
);
