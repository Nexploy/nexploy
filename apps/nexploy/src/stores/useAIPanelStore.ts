import { create } from 'zustand/react';
import { persist } from 'zustand/middleware';
import type { SelectedModel } from '@workspace/typescript-interface/ai/aiConfig';

interface AIPanelStore {
    isOpen: boolean;
    pendingPrompt: string | null;
    selectedModel: SelectedModel | null;
    modelSelectorOpen: boolean;
    aiEnabled: boolean;
    openPanel: (prompt?: string) => void;
    closePanel: () => void;
    clearPendingPrompt: () => void;
    setSelectedModel: (model: SelectedModel) => void;
    openModelSelector: () => void;
    closeModelSelector: () => void;
    setAiEnabled: (enabled: boolean) => void;
}

export const useAIPanelStore = create<AIPanelStore>()(
    persist(
        (set) => ({
            isOpen: false,
            pendingPrompt: null,
            selectedModel: null,
            modelSelectorOpen: false,
            aiEnabled: true,
            openPanel: (prompt) => set({ isOpen: true, pendingPrompt: prompt ?? null }),
            closePanel: () => set({ isOpen: false, modelSelectorOpen: false }),
            clearPendingPrompt: () => set({ pendingPrompt: null }),
            setSelectedModel: (model) => set({ selectedModel: model }),
            openModelSelector: () => set({ modelSelectorOpen: true }),
            closeModelSelector: () => set({ modelSelectorOpen: false }),
            setAiEnabled: (enabled) => set({ aiEnabled: enabled }),
        }),
        {
            name: 'ai-panel',
            partialize: (state) => ({ selectedModel: state.selectedModel }),
        },
    ),
);
