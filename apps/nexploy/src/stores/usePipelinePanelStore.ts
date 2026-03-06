import { create } from 'zustand';

export type PipelinePanel = 'palette' | 'template';

interface PipelinePanelStore {
    activePanel: PipelinePanel | null;
    paletteCategory: string | null;
    paletteSearch: string;
    openPanel: (panel: PipelinePanel) => void;
    closePanel: () => void;
    togglePanel: (panel: PipelinePanel) => void;
    setPaletteCategory: (category: string | null) => void;
    setPaletteSearch: (search: string) => void;
    openPaletteCategory: (category: string) => void;
    closePalette: () => void;
}

export const usePipelinePanelStore = create<PipelinePanelStore>((set) => ({
    activePanel: null,
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
