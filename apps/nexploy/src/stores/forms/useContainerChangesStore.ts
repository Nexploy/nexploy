import { create } from 'zustand';
import { PortType } from '@workspace/typescript-interface/docker/docker.port';

export type PortChange = {
    typeAction: 'add' | 'edit' | 'delete';

    publicPort?: number;
    privatePort?: number;
    type?: PortType;

    currentPublicPort?: number;
    currentPrivatePort?: number;
    currentType?: PortType;
};

export type EnvVarChange = {
    typeAction: 'add' | 'edit' | 'delete';

    key?: string;
    value?: string;

    currentKey?: string;
    currentValue?: string;
};

type ContainerChangesStore = {
    portChanges: PortChange[];
    envVarChanges: EnvVarChange[];

    onPortChange: (change: PortChange) => void;

    onEnvVarChange: (change: EnvVarChange) => void;

    resetAllChanges: () => void;
    hasChanges: () => boolean;
};

export const useContainerChangesStore = create<ContainerChangesStore>((set, get) => ({
    portChanges: [],
    envVarChanges: [],

    onPortChange: (change) =>
        set((state) => {
            const portChanges = [...state.portChanges];

            const portIdentifier = {
                currentPublicPort: change.currentPublicPort,
                currentPrivatePort: change.currentPrivatePort,
                currentType: change.currentType,
            };

            const existingIndex = portChanges.findIndex((c) => {
                if (c.typeAction === 'add') {
                    return (
                        c.publicPort === portIdentifier.currentPublicPort &&
                        c.privatePort === portIdentifier.currentPrivatePort &&
                        c.type === portIdentifier.currentType
                    );
                }
                return (
                    c.currentPublicPort === portIdentifier.currentPublicPort &&
                    c.currentPrivatePort === portIdentifier.currentPrivatePort &&
                    c.currentType === portIdentifier.currentType
                );
            });

            if (existingIndex !== -1) {
                const existing = portChanges[existingIndex];

                if (existing?.typeAction === 'add' && change.typeAction === 'edit') {
                    portChanges[existingIndex] = {
                        typeAction: 'add',
                        publicPort: change.publicPort,
                        privatePort: change.privatePort,
                        type: change.type,
                    };
                    return { portChanges };
                }

                if (existing?.typeAction === 'add' && change.typeAction === 'delete') {
                    portChanges.splice(existingIndex, 1);
                    return { portChanges };
                }

                if (existing?.typeAction === 'edit' && change.typeAction === 'delete') {
                    portChanges[existingIndex] = {
                        typeAction: 'delete',
                        currentPublicPort: existing?.currentPublicPort,
                        currentPrivatePort: existing?.currentPrivatePort,
                        currentType: existing?.currentType,
                    };
                    return { portChanges };
                }

                if (existing?.typeAction === 'edit' && change.typeAction === 'edit') {
                    portChanges[existingIndex] = {
                        typeAction: 'edit',
                        publicPort: change.publicPort,
                        privatePort: change.privatePort,
                        type: change.type,
                        currentPublicPort: existing?.currentPublicPort,
                        currentPrivatePort: existing?.currentPrivatePort,
                        currentType: existing?.currentType,
                    };
                    return { portChanges };
                }

                if (existing?.typeAction === 'delete' && change.typeAction === 'edit') {
                    portChanges[existingIndex] = {
                        typeAction: 'edit',
                        publicPort: change.publicPort,
                        privatePort: change.privatePort,
                        type: change.type,
                        currentPublicPort: existing?.currentPublicPort,
                        currentPrivatePort: existing?.currentPrivatePort,
                        currentType: existing?.currentType,
                    };
                    return { portChanges };
                }

                if (existing?.typeAction === 'delete' && change.typeAction === 'delete') {
                    return { portChanges };
                }
            }

            portChanges.push(change);
            return { portChanges };
        }),

    onEnvVarChange: (change) =>
        set((state) => {
            const envVarChanges = [...state.envVarChanges];

            const varIdentifier = {
                currentKey: change.currentKey,
            };

            const existingIndex = envVarChanges.findIndex((c) => {
                if (c.typeAction === 'add') {
                    return c.key === varIdentifier.currentKey;
                }
                return c.currentKey === varIdentifier.currentKey;
            });

            if (existingIndex !== -1) {
                const existing = envVarChanges[existingIndex];

                if (existing?.typeAction === 'add' && change.typeAction === 'edit') {
                    envVarChanges[existingIndex] = {
                        typeAction: 'add',
                        key: change.key,
                        value: change.value,
                    };
                    return { envVarChanges };
                }

                if (existing?.typeAction === 'add' && change.typeAction === 'delete') {
                    envVarChanges.splice(existingIndex, 1);
                    return { envVarChanges };
                }

                if (existing?.typeAction === 'edit' && change.typeAction === 'delete') {
                    envVarChanges[existingIndex] = {
                        typeAction: 'delete',
                        currentKey: existing?.currentKey,
                        currentValue: existing?.currentValue,
                    };
                    return { envVarChanges };
                }

                if (existing?.typeAction === 'edit' && change.typeAction === 'edit') {
                    envVarChanges[existingIndex] = {
                        typeAction: 'edit',
                        key: change.key,
                        value: change.value,
                        currentKey: existing?.currentKey,
                        currentValue: existing?.currentValue,
                    };
                    return { envVarChanges };
                }

                if (existing?.typeAction === 'delete' && change.typeAction === 'edit') {
                    envVarChanges[existingIndex] = {
                        typeAction: 'edit',
                        key: change.key,
                        value: change.value,
                        currentKey: existing?.currentKey,
                        currentValue: existing?.currentValue,
                    };
                    return { envVarChanges };
                }

                if (existing?.typeAction === 'delete' && change.typeAction === 'delete') {
                    return { envVarChanges };
                }
            }

            envVarChanges.push(change);
            return { envVarChanges };
        }),

    resetAllChanges: () =>
        set({
            portChanges: [],
            envVarChanges: [],
        }),

    hasChanges: () => {
        const state = get();
        return state.portChanges.length > 0 || state.envVarChanges.length > 0;
    },
}));
