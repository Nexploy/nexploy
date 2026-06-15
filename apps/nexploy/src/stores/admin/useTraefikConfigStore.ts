'use client';

import { createContext, useContext } from 'react';
import { createStore, useStore } from 'zustand';
import { toast } from 'sonner';
import { fetcherApi } from '@/lib/api/fetcherApi';
import { formatYaml, validateYaml } from '@/lib/yaml';
import { deleteTraefikFile } from '@/actions/admin/deleteTraefikFile.action';
import { saveTraefikFile } from '@/actions/admin/saveTraefikFile.action';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';
import { TranslationFunction } from '@workspace/typescript-interface/commun.ts';
import type { TraefikTreeNode } from '@/lib/traefik/types';
import { insertFileNode, removeNode } from '@/lib/traefik/treeOps';

function fileUrl(relPath: string): string {
    const segments = relPath.split('/').map(encodeURIComponent).join('/');
    return `/api/admin/traefik/${segments}`;
}

export interface TraefikConfigState {
    tree: TraefikTreeNode[];
    selectedFile: string | null;
    fileContent: string;
    savedContent: string;
    contentLoading: boolean;
    isSaving: boolean;
    yamlError: string | null;
    isDiffMode: boolean;

    isDirty: () => boolean;

    loadFile: (name: string) => Promise<void>;
    selectFile: (name: string, t: TranslationFunction) => void;
    setFileContent: (content: string) => void;
    deleteFile: (t: TranslationFunction, filename?: string) => void;
    formatContent: (t: TranslationFunction) => void;
    toggleDiffMode: () => void;
    afterNewFile: (name: string) => Promise<void>;

    _flushSave: () => Promise<void>;
}

export function createTraefikConfigStore(initialTree: TraefikTreeNode[]) {
    let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;

    return createStore<TraefikConfigState>((set, get) => ({
        tree: initialTree,
        selectedFile: null,
        fileContent: '',
        savedContent: '',
        contentLoading: false,
        isSaving: false,
        yamlError: null,
        isDiffMode: false,

        isDirty: () => get().fileContent !== get().savedContent,

        loadFile: async (name) => {
            set({ contentLoading: true, isDiffMode: false });
            try {
                const data = await fetcherApi<{ name: string; content: string }>({
                    url: fileUrl(name),
                });
                set({
                    fileContent: data.content,
                    savedContent: data.content,
                    selectedFile: name,
                    yamlError: validateYaml(data.content),
                });
            } finally {
                set({ contentLoading: false });
            }
        },

        selectFile: (name, t) => {
            const state = get();
            if (name === state.selectedFile) return;

            if (autoSaveTimer) {
                clearTimeout(autoSaveTimer);
                autoSaveTimer = null;
            }

            if (state.isDirty() && state.yamlError) {
                useAlertConfirmationDialogStore.getState().openAlertDialog({
                    title: t('unsavedChangesTitle'),
                    description: t('unsavedChangesDescription'),
                    cancelLabel: t('keepEditing'),
                    actionLabel: t('discardChanges'),
                    onAction: async () => {
                        await get().loadFile(name);
                    },
                });
                return;
            }

            if (state.isDirty()) {
                get()
                    ._flushSave()
                    .then(() => get().loadFile(name));
                return;
            }

            get().loadFile(name);
        },

        setFileContent: (content) => {
            const error = validateYaml(content);
            set({ fileContent: content, yamlError: error });

            if (autoSaveTimer) {
                clearTimeout(autoSaveTimer);
                autoSaveTimer = null;
            }

            if (!error) {
                autoSaveTimer = setTimeout(() => get()._flushSave(), 200);
            }
        },

        _flushSave: async () => {
            const { selectedFile, fileContent } = get();
            if (!selectedFile) return;
            set({ isSaving: true });
            try {
                const result = await saveTraefikFile({
                    filename: selectedFile,
                    content: fileContent,
                });
                if (!result?.serverError && result?.data?.success) {
                    set({ savedContent: fileContent });
                }
            } finally {
                set({ isSaving: false });
            }
        },

        deleteFile: (t, filename) => {
            const target = filename ?? get().selectedFile;
            if (!target) return;

            useAlertConfirmationDialogStore.getState().openAlertDialog({
                title: t('deleteTitle'),
                description: t('deleteDescription', { name: target }),
                cancelLabel: t('cancel'),
                actionLabel: t('delete'),
                onAction: async () => {
                    const result = await deleteTraefikFile({ filename: target });
                    if (result?.serverError || !result?.data?.success) {
                        toast.error(t('deleteError'));
                        return;
                    }
                    toast.success(t('deletedSuccess'));
                    set((s) => ({
                        tree: removeNode(s.tree, target),
                        ...(target === s.selectedFile
                            ? {
                                  selectedFile: null,
                                  fileContent: '',
                                  savedContent: '',
                                  isDiffMode: false,
                                  yamlError: null,
                              }
                            : {}),
                    }));
                },
            });
        },

        formatContent: (t) => {
            const { yamlError, fileContent } = get();
            if (yamlError || !fileContent.trim()) return;
            try {
                const formatted = formatYaml(fileContent);
                set({ fileContent: formatted, yamlError: null });
                if (autoSaveTimer) clearTimeout(autoSaveTimer);
                autoSaveTimer = setTimeout(() => get()._flushSave(), 200);
                toast.success(t('formatSuccess'));
            } catch {
                toast.error(t('formatError'));
            }
        },

        toggleDiffMode: () => set((s) => ({ isDiffMode: !s.isDiffMode })),

        afterNewFile: async (name) => {
            if (autoSaveTimer) {
                clearTimeout(autoSaveTimer);
                autoSaveTimer = null;
            }
            // The file was just created empty server-side; insert it and open it
            // locally without re-fetching the whole tree or its content.
            set((s) => ({
                tree: insertFileNode(s.tree, name),
                selectedFile: name,
                fileContent: '',
                savedContent: '',
                yamlError: validateYaml(''),
                isDiffMode: false,
                contentLoading: false,
            }));
        },
    }));
}

export type TraefikConfigStore = ReturnType<typeof createTraefikConfigStore>;

export const TraefikConfigContext = createContext<TraefikConfigStore | null>(null);

export function useTraefikConfigStore(): TraefikConfigState {
    const store = useContext(TraefikConfigContext);
    if (!store) throw new Error('useTraefikConfigStore must be used within TraefikConfigProvider');
    return useStore(store);
}
