import { PortType } from '../../docker/docker.port';

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

export type VolumeChange = {
    typeAction: 'add' | 'delete';

    hostPath?: string;
    containerPath?: string;
    readOnly?: boolean;

    currentHostPath?: string;
    currentContainerPath?: string;
    currentReadOnly?: boolean;
};

export type NetworkChange = {
    typeAction: 'add' | 'edit' | 'delete';

    name?: string;

    currentName?: string;
};

export type ContainerChangesStore = {
    portChanges: PortChange[];
    envVarChanges: EnvVarChange[];
    volumeChanges: VolumeChange[];
    networkChanges: NetworkChange[];

    onPortChange: (change: PortChange) => void;
    onEnvVarChange: (change: EnvVarChange) => void;
    onVolumeChange: (change: VolumeChange) => void;
    onNetworkChange: (change: NetworkChange) => void;

    resetAllChanges: () => void;
    hasChanges: () => boolean;
};
