export interface Volume {
    name: string;
    driver: string;
    mountpoint: string;
    createdAt: number;
    labels: { [key: string]: string };
    scope: string;
    options: { [key: string]: string };
    usageData?: {
        Size: number;
        RefCount: number;
    } | null;
    timestamp: number;
}

export type VolumeAction = 'create' | 'mount' | 'unmount' | 'destroy';

export interface VolumeStateChanges {
    labels?: {
        from: { [key: string]: string };
        to: { [key: string]: string };
    };
    options?: {
        from: { [key: string]: string };
        to: { [key: string]: string };
    };
    usageData?: {
        from?: {
            Size: number;
            RefCount: number;
        } | null;
        to?: {
            Size: number;
            RefCount: number;
        } | null;
    };
}

export type VolumeType = 'initial' | 'state-change' | 'updated' | 'added' | 'removed' | 'heartbeat';

export interface VolumeEvent {
    type: VolumeType;
    timestamp: number;
    volumes?: Volume[];
    volume?: Volume;
    oldState?: Volume;
    volumeName?: string;
    changes?: VolumeStateChanges;
}
