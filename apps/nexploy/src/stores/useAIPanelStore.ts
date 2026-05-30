import { create } from 'zustand/react';

interface AIPanelStore {
    isOpen: boolean;
    pendingPrompt: string | null;
    openPanel: (prompt?: string) => void;
    closePanel: () => void;
    clearPendingPrompt: () => void;
}

export const useAIPanelStore = create<AIPanelStore>((set) => ({
    isOpen: false,
    pendingPrompt: null,
    openPanel: (prompt) => set({ isOpen: true, pendingPrompt: prompt ?? null }),
    closePanel: () => set({ isOpen: false }),
    clearPendingPrompt: () => set({ pendingPrompt: null }),
}));
