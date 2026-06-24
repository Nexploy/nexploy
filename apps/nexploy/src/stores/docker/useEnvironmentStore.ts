import { create } from 'zustand';
import { sseMultiplexer } from '@/services/SSEMultiplexer';
import { Environment } from 'generated/client';
import { useDockerStore } from '@/stores/docker/useDockerStore';
import { useContainersStore } from '@/stores/docker/useContainersStore';
import { useImagesStore } from '@/stores/docker/useImagesStore';
import { useVolumesStore } from '@/stores/docker/useVolumesStore';
import { useNetworksStore } from '@/stores/docker/useNetworksStore';

const resetDockerStores = () => {
    const stores = [
        useDockerStore,
        useContainersStore,
        useImagesStore,
        useVolumesStore,
        useNetworksStore,
    ];

    stores.forEach((store) => store.getState().reset());
    stores.forEach((store) => store.getState().connect());
};

export interface EnvironmentState {
    environments: Environment[];
    selectedEnvironmentId: string | null;
    isLoading: boolean;

    setEnvironments: (environments: Environment[]) => void;
    selectEnvironment: (environmentId: string) => void;
    addEnvironment: (environment: Environment) => void;
    updateEnvironment: (id: string, data: Partial<Environment>) => void;
    removeEnvironment: (id: string) => void;
    getSelectedEnvironment: () => Environment | undefined;
}

export const useEnvironmentStore = create<EnvironmentState>((set, get) => {
    return {
        environments: [],
        selectedEnvironmentId: null,
        isLoading: false,

        setEnvironments: (environments) => {
            set({ environments });

            const current = get().selectedEnvironmentId;
            if (!current || !environments.find((e) => e.id === current)) {
                const newId = determineInitialEnvironmentId(environments);
                if (newId && newId !== current) {
                    set({ selectedEnvironmentId: newId });
                    sseMultiplexer.setEnvironmentId(newId);
                    setEnvironmentCookie(newId);
                    resetDockerStores();
                }
            }
        },

        selectEnvironment: (environmentId) => {
            if (environmentId === get().selectedEnvironmentId) return;

            set({ selectedEnvironmentId: environmentId });
            sseMultiplexer.setEnvironmentId(environmentId);
            setEnvironmentCookie(environmentId);
            resetDockerStores();
        },

        addEnvironment: (environment) => {
            set((state) => ({
                environments: [...state.environments, environment],
            }));
        },

        updateEnvironment: (id, data) => {
            set((state) => ({
                environments: state.environments.map((env) =>
                    env.id === id ? { ...env, ...data } : env,
                ),
            }));
        },

        removeEnvironment: (id) => {
            set((state) => {
                const newEnvironments = state.environments.filter((env) => env.id !== id);

                let newSelectedId = state.selectedEnvironmentId;

                if (state.selectedEnvironmentId === id) {
                    newSelectedId = determineInitialEnvironmentId(newEnvironments);

                    if (newSelectedId) {
                        sseMultiplexer.setEnvironmentId(newSelectedId);
                        setEnvironmentCookie(newSelectedId);
                    }
                    resetDockerStores();
                }

                return {
                    environments: newEnvironments,
                    selectedEnvironmentId: newSelectedId,
                };
            });
        },

        getSelectedEnvironment: () => {
            const state = get();
            return state.environments.find((e) => e.id === state.selectedEnvironmentId);
        },
    };
});

export const initializeEnvironmentStore = (initialEnvironments: Environment[]) => {
    const initialSelectedId = determineInitialEnvironmentId(initialEnvironments);

    if (initialSelectedId) {
        sseMultiplexer.setEnvironmentId(initialSelectedId);
        setEnvironmentCookie(initialSelectedId);
    }

    useEnvironmentStore.setState({
        environments: initialEnvironments,
        selectedEnvironmentId: initialSelectedId,
    });
};

const getEnvironmentIdFromCookie = (): string | null => {
    if (typeof window === 'undefined') return null;

    const cookies = document.cookie.split(';');
    const environmentCookie = cookies.find((c) => c.trim().startsWith('X-Docker-Environment='));

    if (environmentCookie) {
        const value = environmentCookie.split('=')[1]?.trim();
        return value || null;
    }

    return null;
};

const setEnvironmentCookie = (environmentId: string) => {
    if (typeof window !== 'undefined') {
        document.cookie = `X-Docker-Environment=${environmentId}; path=/; max-age=31536000; SameSite=Lax`;
    }
};

const determineInitialEnvironmentId = (environments: Environment[]): string | null => {
    if (environments.length === 0) return null;

    const cookieId = getEnvironmentIdFromCookie();
    if (cookieId && environments.find((e) => e.id === cookieId)) {
        return cookieId;
    }

    const defaultEnv = environments.find((e) => e.isDefault);
    if (defaultEnv) {
        return defaultEnv.id;
    }

    return environments[0]!.id;
};
