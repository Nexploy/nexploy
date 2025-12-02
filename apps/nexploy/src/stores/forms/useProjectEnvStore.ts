import { create } from 'zustand';

interface EnvVariable {
    id: string;
    key: string;
    value: string;
}

interface NewEnvVariable {
    key: string;
    value: string;
}

interface ProjectEnvState {
    envVariables: EnvVariable[];
    originalEnvVariables: EnvVariable[];
    newEnvs: NewEnvVariable[];
    deletedIds: string[];
    showValues: Record<string, boolean>;

    initialize: (envVariables: EnvVariable[]) => void;
    addNew: () => void;
    removeNew: (index: number) => void;
    updateNew: (index: number, field: keyof NewEnvVariable, value: string) => void;
    updateExisting: (id: string, field: keyof EnvVariable, value: string) => void;
    deleteExisting: (id: string) => void;
    undoDelete: (id: string) => void;
    toggleShowValue: (key: string) => void;
    resetAfterSave: () => void;

    get hasChanges(): boolean;
    get activeEnvs(): EnvVariable[];
    get deletedEnvs(): EnvVariable[];
}

export const useProjectEnvStore = create<ProjectEnvState>((set, get) => ({
    envVariables: [],
    originalEnvVariables: [],
    newEnvs: [],
    deletedIds: [],
    showValues: {},

    initialize: (envVariables: EnvVariable[]) =>
        set({
            envVariables,
            originalEnvVariables: [...envVariables],
            newEnvs: [],
            deletedIds: [],
            showValues: {},
        }),

    addNew: () => set((state) => ({ newEnvs: [...state.newEnvs, { key: '', value: '' }] })),

    removeNew: (index: number) =>
        set((state) => {
            const newEnvs = [...state.newEnvs];
            newEnvs.splice(index, 1);
            const showValues = { ...state.showValues };
            delete showValues[`new-${index}`];
            // Adjust keys for remaining newEnvs if necessary, but for simplicity, skip or handle in component
            return { newEnvs, showValues };
        }),

    updateNew: (index: number, field: keyof NewEnvVariable, value: string) =>
        set((state) => {
            const newEnvs = [...state.newEnvs];
            if (newEnvs[index]) {
                newEnvs[index] = { ...newEnvs[index], [field]: value };
            }
            return { newEnvs };
        }),

    updateExisting: (id: string, field: keyof EnvVariable, value: string) =>
        set((state) => ({
            envVariables: state.envVariables.map((env) =>
                env.id === id ? { ...env, [field]: value } : env,
            ),
        })),

    deleteExisting: (id: string) => set((state) => ({ deletedIds: [...state.deletedIds, id] })),

    undoDelete: (id: string) =>
        set((state) => ({ deletedIds: state.deletedIds.filter((did) => did !== id) })),

    toggleShowValue: (key: string) =>
        set((state) => ({
            showValues: { ...state.showValues, [key]: !state.showValues[key] },
        })),

    resetAfterSave: () =>
        set((state) => ({
            newEnvs: [],
            deletedIds: [],
            showValues: {},
            originalEnvVariables: [...state.envVariables], // Update original to reflect saves
        })),

    get hasChanges(): boolean {
        const state = get();
        if (state.newEnvs.some((env) => env.key.trim() !== '')) return true;
        if (state.deletedIds.length > 0) return true;
        const originalMap = new Map(state.originalEnvVariables.map((env) => [env.id, env]));
        return state.envVariables.some((env) => {
            const original = originalMap.get(env.id);
            return !original || original.key !== env.key || original.value !== env.value;
        });
    },

    get activeEnvs(): EnvVariable[] {
        const state = get();
        return state.envVariables.filter((env) => !state.deletedIds.includes(env.id));
    },

    get deletedEnvs(): EnvVariable[] {
        const state = get();
        return state.envVariables.filter((env) => state.deletedIds.includes(env.id));
    },
}));
