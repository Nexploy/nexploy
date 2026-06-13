import type { SelectedModel } from '../ai/aiConfig';

export interface AIPanelStore {
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
