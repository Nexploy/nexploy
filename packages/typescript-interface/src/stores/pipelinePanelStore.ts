export type PipelinePanel = 'palette' | 'template' | 'test';

export interface PipelinePanelStore {
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
