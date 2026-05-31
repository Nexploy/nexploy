import { create } from 'zustand/react';
import { persist } from 'zustand/middleware';
import type { SelectedModel } from '@workspace/typescript-interface/ai/aiConfig';

interface AIPanelStore {
    isOpen: boolean;
    pendingPrompt: string | null;
    selectedModel: SelectedModel | null;
    modelSelectorOpen: boolean;
    openPanel: (prompt?: string) => void;
    closePanel: () => void;
    clearPendingPrompt: () => void;
    setSelectedModel: (model: SelectedModel) => void;
    openModelSelector: () => void;
    closeModelSelector: () => void;
}

export const useAIPanelStore = create<AIPanelStore>()(
    persist(
        (set) => ({
            isOpen: false,
            pendingPrompt: null,
            selectedModel: null,
            modelSelectorOpen: false,
            openPanel: (prompt) => set({ isOpen: true, pendingPrompt: prompt ?? null }),
            closePanel: () => set({ isOpen: false }),
            clearPendingPrompt: () => set({ pendingPrompt: null }),
            setSelectedModel: (model) => set({ selectedModel: model }),
            openModelSelector: () => set({ modelSelectorOpen: true }),
            closeModelSelector: () => set({ modelSelectorOpen: false }),
        }),
        {
            name: 'ai-panel',
            partialize: (state) => ({ selectedModel: state.selectedModel }),
        },
    ),
);
