import type { SelectedModel } from '../ai/aiConfig.js';

export interface AIPanelStore {
    isOpen: boolean;
    pendingPrompt: string | null;
    selectedModel: SelectedModel | null;
    modelSelectorOpen: boolean;
    isFullscreen: boolean;
    aiEnabled: boolean;
    openPanel: (prompt?: string) => void;
    closePanel: () => void;
    clearPendingPrompt: () => void;
    setSelectedModel: (model: SelectedModel) => void;
    openModelSelector: () => void;
    closeModelSelector: () => void;
    setFullscreen: (fullscreen: boolean) => void;
    toggleFullscreen: () => void;
    setAiEnabled: (enabled: boolean) => void;
}
