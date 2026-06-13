import { create } from 'zustand';
import type { PipelinePanelStore } from '@workspace/typescript-interface/stores/pipelinePanelStore';

export const usePipelinePanelStore = create<PipelinePanelStore>((set) => ({
    activePanel: 'palette',
    paletteCategory: null,
    paletteSearch: '',

    openPanel: (panel) => set({ activePanel: panel }),
    closePanel: () => set({ activePanel: null, paletteCategory: null, paletteSearch: '' }),
    togglePanel: (panel) =>
        set((s) => ({
            activePanel: s.activePanel === panel ? null : panel,
            paletteCategory: null,
            paletteSearch: '',
        })),

    setPaletteCategory: (paletteCategory) => set({ paletteCategory }),
    setPaletteSearch: (paletteSearch) => set({ paletteSearch }),
    openPaletteCategory: (category) =>
        set({ activePanel: 'palette', paletteCategory: category, paletteSearch: '' }),
    closePalette: () => set({ activePanel: null, paletteCategory: null, paletteSearch: '' }),
}));
